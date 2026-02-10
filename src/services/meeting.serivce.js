const Meeting = require("../models/Meeting");
const { v4: uuidV4 } = require("uuid");
const { logMeetingEvent } = require("./meetingLog.service");
const MeetingHistory = require("../models/MeetingHistory");

/* ================================
   INTERNAL HELPERS (PRIVATE)
================================ */

const getParticipant = (meeting, userId) => {
  return meeting.participants.find(
    (p) => p.user.toString() === userId.toString(),
  );
};

const hasRole = (meeting, userId, roles = []) => {
  const participant = getParticipant(meeting, userId);
  if (!participant) return false;
  return roles.includes(participant.role);
};

/* ================================
   CREATE MEETING
================================ */
const createMeeting = async (userId) => {
  const meeting = await Meeting.create({
    meetingId: uuidV4().slice(0, 6),
    host: userId,
    isActive: true,
    participants: [
      {
        user: userId,
        isMuted: false,
        role: "HOST",
      },
    ],
  });

  await MeetingHistory.create({
    meetingId: meeting.meetingId,
    user: userId,
    role: "HOST",
    joinedAt: Date.now(),
  });

  await logMeetingEvent({
    meetingId: meeting.meetingId,
    action: "MEETING_CREATED",
    actor: userId,
  });

  return meeting;
};

/* ================================
   GET ACTIVE MEETING
================================ */
const getActiveMeeting = async (meetingId) => {
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) throw new Error("Meeting not found");
  if (!meeting.isActive) throw new Error("Meeting already ended");
  return meeting;
};

/* ================================
   REQUEST JOIN MEETING
================================ */
const requestJoinMeeting = async (meetingId, userId, name) => {
  const meeting = await getActiveMeeting(meetingId);

  if (getParticipant(meeting, userId)) {
    throw new Error("Already Joined Meeting");
  }

  if (meeting.waitingRoom.some((w) => w.userId.equals(userId))) {
    throw new Error("Already Requested to Join Meeting");
  }

  meeting.waitingRoom.push({ userId, name });
  await meeting.save();

  return meeting;
};
/* ================================
   APPROVE JOIN MEETING
================================ */
const approveJoinMeeting = async (meetingId, hostId, targetUserId) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!hasRole(meeting, hostId, ["HOST"])) {
    throw new Error("Only host can approve join request");
  }

  const waitingUser = meeting.waitingRoom.find(
    (w) => w.userId.toString() === targetUserId.toString(),
  );

  if (!waitingUser) {
    throw new Error("User not in waiting room");
  }

  meeting.waitingRoom = meeting.waitingRoom.filter(
    (w) => w.userId.toString() !== targetUserId.toString(),
  );

  meeting.participants.push({
    user: targetUserId,
    role: "PARTICIPANT",
  });

  try {
    await MeetingHistory.create({
      meetingId: meetingId,
      user: targetUserId,
      role: "PARTICIPANT",
      joinedAt: new Date(),
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  await meeting.save();

  await logMeetingEvent({
    meetingId,
    action: "USER_APPROVED",
    actor: hostId,
    target: targetUserId,
  });

  return waitingUser;
};

/* ================================
   JOIN MEETING
================================ */
const joinMeeting = async (meetingId, userId) => {
  const meeting = await getActiveMeeting(meetingId);

  const alreadyJoined = getParticipant(meeting, userId);

  if (!alreadyJoined) {
    meeting.participants.push({
      user: userId,
      isMuted: false,
      role: "PARTICIPANT",
    });

    await meeting.save();

    try {
      await MeetingHistory.create({
        meetingId,
        user: userId,
        role: "PARTICIPANT",
        joinedAt: new Date(),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    await logMeetingEvent({
      meetingId,
      action: "USER_JOINED",
      actor: userId,
    });
  }

  return { meeting, isNew: !alreadyJoined };
};

/* ================================
   LEAVE MEETING
================================ */
const leaveMeeting = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  // If meeting already ended, just return
  if (!meeting.isActive) {
    return { ended: true };
  }

  // HOST leaves → meeting ends
  if (hasRole(meeting, userId, ["HOST"])) {
    meeting.isActive = false;
    meeting.endAt = new Date();
    await meeting.save();

    await logMeetingEvent({
      meetingId,
      action: "MEETING_ENDED",
      actor: userId,
    });

    return { ended: true };
  }

  const beforeCount = meeting.participants.length;

  meeting.participants = meeting.participants.filter(
    (p) => p.user.toString() !== userId.toString(),
  );

  if (meeting.participants.length !== beforeCount) {
    await meeting.save();

    await MeetingHistory.findOneAndUpdate(
      { meetingId, user: userId },
      { leftAt: new Date() },
    );

    await logMeetingEvent({
      meetingId,
      action: "USER_LEFT",
      actor: userId,
    });
  }

  return { ended: false };
};

/* ================================
   END MEETING (HOST ONLY)
================================ */
const endMeeting = async (meetingId, userId) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!hasRole(meeting, userId, ["HOST"])) {
    throw new Error("Only host can end meeting");
  }

  meeting.isActive = false;
  meeting.endAt = new Date();
  await meeting.save();

  await MeetingHistory.updateMany({ meetingId }, { leftAt: new Date() });

  await logMeetingEvent({
    meetingId,
    action: "MEETING_ENDED",
    actor: userId,
  });

  return meeting;
};

/* ================================
   SELF MUTE / UNMUTE
================================ */
const setMuteState = async (meetingId, userId, isMuted) => {
  const meeting = await getActiveMeeting(meetingId);

  const participant = getParticipant(meeting, userId);
  if (!participant) throw new Error("User not in meeting");

  participant.isMuted = isMuted;
  await meeting.save();

  await logMeetingEvent({
    meetingId,
    action: isMuted ? "SELF_MUTED" : "SELF_UNMUTED",
    actor: userId,
  });

  return participant;
};

/* ================================
   HOST / CO_HOST → MUTE / UNMUTE USER
================================ */
const hostSetMuteState = async (meetingId, actorId, targetUserId, isMuted) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!hasRole(meeting, actorId, ["HOST", "CO_HOST"])) {
    throw new Error("Not allowed to mute others");
  }

  const participant = getParticipant(meeting, targetUserId);
  if (!participant) throw new Error("Target user not in meeting");

  participant.isMuted = isMuted;
  await meeting.save();

  await logMeetingEvent({
    meetingId,
    action: isMuted ? "HOST_MUTED" : "HOST_UNMUTED",
    actor: actorId,
    target: targetUserId,
  });

  return participant;
};

/* ================================
   HOST / CO_HOST → KICK USER
================================ */
const kickUser = async (meetingId, actorId, targetUserId) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!hasRole(meeting, actorId, ["HOST", "CO_HOST"])) {
    throw new Error("Not allowed to kick users");
  }

  const beforeCount = meeting.participants.length;

  meeting.participants = meeting.participants.filter(
    (p) => p.user.toString() !== targetUserId.toString(),
  );

  if (meeting.participants.length === beforeCount) {
    throw new Error("User not found in meeting");
  }

  await meeting.save();

  await logMeetingEvent({
    meetingId,
    action: "USER_KICKED",
    actor: actorId,
    target: targetUserId,
  });

  return true;
};

/* ================================
   HOST → PROMOTE CO_HOST
================================ */
const promoteToCoHost = async (meetingId, hostId, targetUserId) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!hasRole(meeting, hostId, ["HOST"])) {
    throw new Error("Only host can promote co-host");
  }

  const participant = getParticipant(meeting, targetUserId);
  if (!participant) throw new Error("User not in meeting");

  if (participant.role === "CO_HOST") {
    return participant; // already co-host
  }

  participant.role = "CO_HOST";
  await meeting.save();

  await logMeetingEvent({
    meetingId,
    action: "USER_PROMOTED_CO_HOST",
    actor: hostId,
    target: targetUserId,
  });

  return participant;
};

/* ================================
   MEETING SNAPSHOT (RECONNECT)
================================ */
const getMeetingSnapshot = async (meetingId) => {
  const meeting = await Meeting.findOne({ meetingId }).populate(
    "participants.user",
    "name email",
  );

  if (!meeting) throw new Error("Meeting not found");

  return {
    meetingId: meeting.meetingId,
    isActive: meeting.isActive,
    participants: meeting.participants.map((p) => ({
      id: p.user._id,
      name: p.user.name,
      email: p.user.email,
      role: p.role,
      isMuted: p.isMuted,
    })),
  };
};

/* ================================
   EXPORTS
================================ */
module.exports = {
  createMeeting,
  getActiveMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  setMuteState,
  hostSetMuteState,
  kickUser,
  promoteToCoHost,
  getMeetingSnapshot,
  requestJoinMeeting,
  approveJoinMeeting,
};
