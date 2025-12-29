const Meeting = require("../models/Meeting");
const { v4: uuidV4 } = require("uuid");

// Create meeting

const createMeeting = async (userId) => {
  const meeting = await Meeting.create({
    meetingId: uuidV4().slice(0, 6),
    host: userId,
    participants: [{ user: userId, isMuted: false }],
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

  return participant;
};

module.exports = {
  createMeeting,
  joinMeeting,
  endMeeting,
  setMuteState,
  leaveMeeting,
};
