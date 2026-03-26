const TechnologyService = require('../services/technology.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
    const techs = await TechnologyService.getAll();

    res.json({
        success: true,
        data: techs
    });
});
