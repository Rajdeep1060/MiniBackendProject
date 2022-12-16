const express = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const http = require('http');
var bodyParser= require('body-parser');
const app = express();
const ejs = require('ejs');
var mysql = require('mysql');

app.set('view engine',ejs);
app.use(bodyParser.urlencoded({ extended: false }))

//session middleware
app.use(sessions({
    secret: "thisismysecretkey",
    saveUninitialized:true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
    resave: false
}));

app.use(cookieParser());

var con = mysql.createConnection({
    host: "localhost",
    user: "root", // my username
    password: "", // my password
    database: "users"
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/sign.html');
})

app.post('/register', (req, res) => {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var userName = req.body.userName;
    var Course=req.body.course;
    var gender=req.body.gender;
    var phone=req.body.phone;
    var password = req.body.password;

    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // checking user already registered or no
        con.query(`SELECT * FROM user WHERE username = '${userName}'`, function(err, result){
            if(err){
                console.log(err);
            };
            if(Object.keys(result).length > 0){
                res.sendFile(__dirname + '/failReg.html');
            }else{
            //creating user page in userPage function
            function userPage(){
                // We create a session for the dashboard (user page) page and save the user data to this session:
                req.session.user = {
                    firstname: firstName,
                    lastname: lastName,
                    username: userName,
                    course:Course,
                    gender:gender,
                    phone:phone,
                    password: password 
                };
                res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body>
                    <div class="container">
                        <h3>Hi, ${firstName} ${lastName} Your are registered</h3>
                        <a href="/">Click here to go to home page</a>
                    </div>
                </body>
                </html>
                `);
            }
                // inserting new user data
                var sql = `INSERT INTO user (fname, lname, username,course, gender , phone , password) VALUES ('${firstName}', '${lastName}', '${userName}', '${Course}','${gender}','${phone}','${password}')`;
                con.query(sql, function (err, result) {
                    if (err){
                        console.log(err);
                    }else{
                        // using userPage function for creating user page
                        userPage();
                    };
                });

        }

        });
    });


});

app.post("/login", (req, res)=>{
    var userName = req.body.userName;
    var Password = req.body.password;
    console.log(userName);
    console.log(Password);
    con.connect(function(err) {
        if(err){
            console.log(err);
        };
        con.query(`SELECT * FROM user WHERE username = '${userName}' AND password = '${Password}'`, function (err, result) {
          if(err){
            console.log(err);
          };

          function userPage(){
            // We create a session for the dashboard (user page) page and save the user data to this session:
            req.session.user = {
                firstname: result[0].fname,
                lastname: result[0].lname,
                username: result[0].username,
                course:result[0].Course,
               gender:result[0].gender,
               phone:result[0].phone,
                password: result[0].password 
            };
            var name="admin";
            if (`${userName}`!=`${name}`) {
            res.render("viewprofile.ejs",{result:result});
            }
            else{
                res.sendFile(__dirname+'/showuser.html');
            }
        }

        if(Object.keys(result).length > 0){
            userPage();
        }else{
            res.sendFile(__dirname + '/failLog.html');
        }

        });
    });
});
app.get("/up",(req,res)=>{
    res.sendFile(__dirname+'/update.html');
})
app.get("/users", (req,res)=> {
    con.query('SELECT * FROM user', function (err, result) {
      if (err) throw err;
      ///res.render() function
      console.log(result);
      res.render('users.ejs', {result: result});
    });
  });
app.post("/update",function(request,res){
    console.log("Update is running");
    var uname=request.body.uname;
    var upass=request.body.upass;
    var newpass=request.body.newpass;
    var newpass1=request.body.newpass1;
    console.log(uname);
    console.log(upass);
    console.log(newpass);
    console.log(newpass1);
    if(newpass != newpass1){
        res.send(
            `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
                <div class="container">
                    <h3>Hi,Your password was incorrect </h3>
                    <a href="/up">Click here to update again</a?
                </div>
            </body>
            </html>
            `);
    }
    else{
    con.connect(function(errror)
    {

        con.query(`update user set password='${newpass}' WHERE username = '${uname}' AND password = '${upass}'`,function(err,result)
        {
            if(err){
                console.log(err);
                throw err;
               }
           else{
          res.sendFile(__dirname+'/redirecthome.html');
           }
        
        })
    })
}
})
app.get("/delete",function(request,response){
    con.connect(function(errror)
    {
        var sql="delete from user where id=?";
        con.query(sql,[request.query.id],function(errror,result)
        {
            if(errror) throw errror;
            console.log(result);
            response.redirect("users");
        })
    })
})
app.listen(3000, ()=>{
    console.log("Server running on http://localhost:3000");
});