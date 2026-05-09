// Checks if a user is logged in
const isAuthenticated = (req,res,next) =>{
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login')
}
// checks if a logged in user is a manager
const isUser = (req,res,next) =>{
    if(req.isAuthenticated() &&req.user.role ==="User"){
        return next();
    }
    res.status(403).send('Access denied:you are not a User')
}
//  checs if is admin
const isAdmin = (req,res,next) =>{
    if(req.isAuthenticated() &&req.user.role ==="admin"){
        return next();
    }
    res.status(403).send('Access denied:you are not a admin')
}

// checks if is salesattendant

module.exports ={isAuthenticated, isAdmin, isUser}