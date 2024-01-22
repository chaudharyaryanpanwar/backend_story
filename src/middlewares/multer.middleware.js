import multer from 'multer'

const storage = multer.diskStorage({
  destination  : function(req  , file , cb){
    cb(null , "./public/temp") //callback
  } ,
  filename : function(req , file , cb) {
    console.log(`logging file ${file}`)
    cb(null , file.originalname)
  }
})

export const upload = multer({storage})