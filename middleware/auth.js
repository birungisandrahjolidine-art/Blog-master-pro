// Checks if a user is logged in
const isAuthenticated = (req,res,next) =>{
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login')
}
// checks if a logged in user is a manager
const isUser = (req,res,next) =>{
    if(req.isAuthenticated() &&req.user.role ==="user"){
        return next();
    }
    res.status(403).send('Access denied:you are not a User')
}
//  checks if is admin
const isAdmin = (req,res,next) =>{
    if(req.isAuthenticated() &&req.user.role ==="admin"){
        return next();
    }
    res.status(403).send('Access denied:you are not a admin')
}
module.exports ={isAuthenticated, isAdmin, isUser}