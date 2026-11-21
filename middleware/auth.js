// Only allow same-site paths, so ?next= can never bounce off the site.
const safeNext = (value) => {
    if (typeof value !== 'string') return null;
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    return value;
};

// Checks if a user is logged in
const isAuthenticated = (req,res,next) =>{
    if(req.isAuthenticated()){
        return next();
    }
    const target = safeNext(req.originalUrl);
    res.redirect(target ? `/login?next=${encodeURIComponent(target)}` : '/login')
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
module.exports ={isAuthenticated, isAdmin, isUser, safeNext}