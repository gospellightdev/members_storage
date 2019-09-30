const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const mysql = require('mysql');
const hbs = require('./modules/hbs');
const fs = require('fs');
const app = express();
const uuid = require('uuid/v4');
const moment = require('moment');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressSession = require('express-session');
const bcrypt = require('bcryptjs');

app.set('views',path.join('views'));
app.set('view engine', 'hbs');
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use('/assets',express.static('./public'));
app.use(expressSession({secret: '7W=wEdPs9YzE'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function(req, res, next){
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    let sql = `SELECT * FROM users WHERE id='${id}'`;

    conn.query(sql, (err, results) => {
        if(results.length>0){
            done(err, results[0]);
        }
    });
});

passport.use('login', new LocalStrategy(function(username, password, done) {
    let sql = `SELECT * FROM users WHERE username='${username}'`;

    conn.query(sql, (err, results) => {
        if(err){
            return done(err);
        }

        if(results.length===0){
            return done(null, false)
        }


        const user = results[0];
        if(bcrypt.compareSync(password, user.password)){
            return done(null, user)
        } else{
            return done(null, false)
        }
    });
}));

const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

//Create connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'members'
});

conn.connect((err) =>{
    if(err) throw err;
    console.log('Mysql Connected...');
});

app.get('/login',(req, res) => {
    res.render('login', {
        login: '',
        password: ''
    });
});

app.post('/login', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Неправильные параметры входа'
}));

app.get('/', isAuthenticated, (req, res) => {
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize || 20;

    let sql = `SELECT * FROM members order by id desc limit ${page*20}, ${pageSize}`;

    conn.query(sql, (err, results) => {
        if(err) throw err;

        res.render('members_list',{
            results: results
        });
    });
});

app.get('/members/:id/view', isAuthenticated, (req, res) => {
    let sql = `SELECT * FROM members where id=${req.params.id}`;
    let query = conn.query(sql, (err, members) => {
        if(err) throw err;

        const member = members[0];

        if(member.photo){
            const bitmap = fs.readFileSync('./photos/'+member.photo+'.jpg');
            member.photoData='data:image/jpeg;base64,'+new Buffer(bitmap).toString('base64');
        } else {
            member.photoData = null;
        }

        res.render('members_view',{
            member: member
        });
    });
});

app.get('/members/add', isAuthenticated, (req, res) => {
    res.render('members_add', {photoData: null});
});

app.post('/members/add',isAuthenticated, (req, res) => {
    let fileName = '';

    if(req.body.photoData){
        fileName = uuid();
        const photoData = req.body.photoData.replace(/^data:image\/jpeg;base64,/, "");
        fs.writeFileSync('./photos/'+fileName+'.jpg', photoData, 'base64');
    }

    let data = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        surname: req.body.surname,
        birth_date: req.body.birth_date ? moment(req.body.birth_date, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
        sex: req.body.sex || null,
        baptism_date: req.body.baptism_date ? moment(req.body.baptism_date, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
        phone: req.body.phone,
        address: req.body.address,
        info: req.body.info,
        photo: fileName
    };

    let sql = "INSERT INTO members SET ?";
    let query = conn.query(sql, data,(err, results) => {
        if(err) throw err;
        res.redirect('/');
    });
});

//route for update data
app.post('/members/:id/update', isAuthenticated, (req, res) => {
    let fileName = '';

    if(req.body.photoData){
        fileName = req.body.photo || uuid();
        const photoData = req.body.photoData.replace(/^data:image\/jpeg;base64,/, "");
        fs.writeFileSync('./photos/'+fileName+'.jpg', photoData, 'base64');
    } else if(req.body.photo){
        fs.unlinkSync('./photos/'+req.body.photo+'.jpg');
    }

    let sql = `UPDATE members SET ? WHERE id=${req.params.id}`;

    let data = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        surname: req.body.surname,
        birth_date: req.body.birth_date ? moment(req.body.birth_date, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
        sex: req.body.sex || null,
        baptism_date: req.body.baptism_date ? moment(req.body.baptism_date, 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
        phone: req.body.phone,
        address: req.body.address,
        info: req.body.info,
        photo: fileName
    };

    let query = conn.query(sql, data,(err, results) => {
        if(err) throw err;
        res.redirect('/?test=test');
    });
});

app.get('/delete/:id', isAuthenticated, (req, res) => {
    let sql = "DELETE FROM members WHERE id="+req.params.id;
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.redirect('/');
    });
});

//server listening
app.listen(8000, () => {
    console.log('Server is running at port 8000');
});