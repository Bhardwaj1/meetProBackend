const Meeting = require("../models/Meeting");
const { v4: uuidV4 } = require("uuid");
const { logMeetingEvent } = require("../services/meetingLog.service");

/* ================================
   INTERNAL HELPERS (PRIVATE)
================================ */

const hasRole = (meeting, userId, roles = []) => {
  const participant = meeting.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (!participant) {
    return false;
  }

  return roles.includes(participant.role);
};
const isHost = (meeting, userId) => {
  return meeting.host.toString() === userId.toString();
};

const getParticipant = (meeting, userId) => {
  return meeting.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
};
// Create meeting

const createMeeting = async (userId) => {
  const meeting = await Meeting.create({
    meetingId: uuidV4().slice(0, 6),
    host: userId,
    participants: [{ user: userId, isMuted: false, role: "HOST" }],
  });

  await logMeetingEvent({
    meetingId: meeting.meetingId,
    action: "MEETING_CREATED",
    actor: userId,
  });

  return meeting;
};

// Active meeting

const getActiveMeeting = async (meetingId) => {
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) {
    throw new Error("Meeting not found");
  }
  if (!meeting.isActive) {
    throw new Error("Meeting already ended");
  }

  return meeting;
};

// Join meeting
const joinMeeting = async (meetingId, userId) => {
  const meeting = await getActiveMeeting(meetingId);
  const alreadyJoined = meeting.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
  if (!alreadyJoined) {
    meeting.participants.push({ user: userId, isMuted: false });
    await meeting.save();
  }

  await logMeetingEvent({
    meetingId,
    action: "USER_JOINED",
    actor: userId,
  });
  return meeting;
};

// Leave meeting
const leaveMeeting = async (meetingId, userId) => {
  const meeting = await getActiveMeeting(meetingId);
  // Host Leaves Meeting Ended
  if (meeting.host.toString() === userId.toString()) {
    meeting.isActive = false;
    meeting.endAt = new Date();
    await meeting.save();
    return { ended: true };
  }
  meeting.participants = meeting.participants.filter(
    (p) => p.user.toString() != userId.toString()
  );
  await meeting.save();
  return { ended: false };
};

// End meeting
const endMeeting = async (meetingId, userId) => {
  const meeting = await getActiveMeeting(meetingId);

  if (meeting.host.toString() !== userId.toString()) {
    throw new Error("Only host can end meeting");
  }
  meeting.isActive = false;
  meeting.endAt = new Date();
  await meeting.save();
  await logMeetingEvent({
    meetingId,
    action: "MEETING_ENDED",
    actor: userId,
  });

  return meeting;
};

// Mute/Unmute State

const setMuteState = async (meetingId, userId, isMuted) => {
  const meeting = await getActiveMeeting(meetingId);

  const participant = meeting.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (!participant) {
    throw new Error("User is not in meeting");
  }

  participant.isMuted = isMuted;
  await meeting.save();

  await logMeetingEvent({
    meetingId,
    actor: userId,
    action: isMuted ? "SELF_MUTED" : "SELF_UNMUTED",
  });
  return participant;
};

/* ================================
   HOST → MUTE / UNMUTE USER
================================ */
const hostSetMuteState = async (meetingId, hostId, targetUserId, isMuted) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!isHost(meeting, hostId)) {
    throw new Error("Only host can mute/unmute others");
  }

  const participant = getParticipant(meeting, targetUserId);
  if (!participant) {
    throw new Error("Target user not in meeting");
  }

  participant.isMuted = isMuted;
  await meeting.save();
  await logMeetingEvent({
    meetingId,
    action: isMuted ? "HOST_MUTED" : "HOST_UNMUTED",
    actor: hostId,
    target: targetUserId,
  });

  return participant;
};

/* ================================
   HOST → KICK USER
================================ */
const kickUser = async (meetingId, hostId, targetUserId) => {
  const meeting = await getActiveMeeting(meetingId);

  if (!isHost(meeting, hostId)) {
    throw new Error("Only host can kick users");
  }

  const beforeCount = meeting.participants.length;

  meeting.participants = meeting.participants.filter(
    (p) => p.user.toString() !== targetUserId.toString()
  );

  if (meeting.participants.length === beforeCount) {
    throw new Error("User not found in meeting");
  }
  await logMeetingEvent({
    meetingId,
    action: "USER_KICKED",
    actor: hostId,
    target: targetUserId,
  });

  await meeting.save();
  return true;
};

const getMeetingSnapshot = async (meetingId) => {
  const meeting = await Meeting.findOne({ meetingId }).populate(
    "participants.user",
    "name email"
  );

  if (!meeting) {
    throw new Error("Meeting not found");
  }
  return {
    meetingId: meeting.meetingId,
    isActive: meeting.isActive,
    host: meeting.host,
    participants: meeting.participants.map((p) => ({
      id: p.user._id,
      name: p.user.name,
      email: p.user.email,
      isMuted: p.isMuted,
    })),
  };
};

module.exports = {
  createMeeting,
  joinMeeting,
  endMeeting,
  setMuteState,
  leaveMeeting,
  hostSetMuteState,
  kickUser,
  getMeetingSnapshot,
};
