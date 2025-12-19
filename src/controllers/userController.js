function getMe(req, res) {
    res.status(200).json({
        success:true,
        user:req.user
    })
}

module.exports = { getMe };
