const Subscrption = require("../models/Subscription");
const Payment = require("../models/Payment");

const createDummyPayment = async (userId, amount) => {
  const payment = await Payment.create({
    user: userId,
    amount,
    status: "SUCCESS",
    provider: "DUMMY",
    providerPaymentId: `dummy_${Date.now()}`,
  });

  await Subscrption.findOneAndUpdate(
    {
      user: userId,
    },
    {
      plan: "PREMIUM",
      startAt: Date.now(),
      endAt: Date.now(),
    },
    {upsert:true}
  );
};
module.exports = { createDummyPayment };
