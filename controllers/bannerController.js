const Banner = require('../models/bannerSchema')

module.exports = {

    getBanner: async(req, res) => {
        try {
           let banner =  await Banner.find().lean()
           res.render('admin/banner',{banner,superAdmin:true,subAdmin:true})
        } catch (error) {
            console.log(error)
        }
    },

    postBannner: async(req, res) => {
        const { title } = req.body
        try {
            let image = req.file.filename
            await Banner.create({
                title: title,
                image:image
            })
            res.redirect('/admin/banner')
        } catch (error) {
            console.log(error)
        }
    },

    deleteBanner: async (req, res) => {
        const bannerId = req.params.id;
        try {
          await Banner.findByIdAndDelete(bannerId);
          res.redirect("/admin/banner");
        } catch (error) {
          console.log(error)
        }
      },

}