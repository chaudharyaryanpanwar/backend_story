const asyncHandler = (requestHandler)=>{
  (req , res ,next)=>{
    Promise.resolve(requsetHandler(req , res, next))
    .catch((err) => next(err));
  }
}
export { asyncHandler }
// const asyncHandler = async(func) => {() => {}}
// const asyncHandler = (fn) => async(req , res ,next) => {
//   try{
//     await fn(req , res , next)
//   }
//   catch(err){
//     res.status(err.code || 500).json({
//       sucess : false,
//       message : err.message,
//     })
//   }
// }