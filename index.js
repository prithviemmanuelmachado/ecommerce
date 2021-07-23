const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const multer  = require('multer');
const cookie_parser = require('cookie-parser');
const mailjet_clinet = require ('node-mailjet');
const port = 3000;

var displayedProducts = 5;

var jwt = require('jsonwebtoken');
var jwt_secret = "jwtSecretKey";

app.set('view engine', 'ejs');
app.set('views', (path.join(__dirname, 'views')));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookie_parser());

app.use(express.static(path.join(__dirname, 'static')));

var upload = multer({ dest: 'static/images/' });

var mailjet = mailjet_clinet.connect('6b00360e9514b06faf2fa7f7f889a3ca', '5b31f7f55f040973d047c9cc9e0aef1b')


app.get('/', (req, res)=>{
  let token = req.cookies.jwt;
  if(token)
  {
    jwt.verify(token, jwt_secret, (err, decodedToken)=>{
      displayedProducts = 5;
      readProduct(function(products)
      {            
        res.render("index",{
          header:'loggedInHeader',
          link: '/viewcart',
          linktext: 'VIEW CART',
          cusname: decodedToken.cusname,
          isAdmin: decodedToken.isAdmin,
          products: products,
          loadmore:"<button id='loadMore' style='float: right;'> LOAD MORE </button>"
        });
      });
    });
    
  }
  else
  {
    readProduct(function(products)
    {
      res.render("index", {
        header: 'logInHeader',
        products: products,
        view: "<button class='view'>VIEW</button>",
        loadmore:"<button id='loadMore' style='float: right;'> LOAD MORE </button>"

      });
    });
    
  }
  
  
});

app.get('/logout', (req, res)=>{
  displayedProducts = 5;
  res.cookie('jwt', '', {maxAge:1});
  res.redirect("/");
});

app.get('/login', (req, res)=>{
  let token = req.cookies.jwt;
  if(token)
  {
    res.redirect("/");
  }
  else
  {
    res.render("login", {
      error:""
    });
  }
  
  
});

app.get('/signup', (req, res)=>{
  let token = req.cookies.jwt;
  if(token)
  {
    res.redirect("/");
  }
  else
  {
    res.render("signup",{
      nameError:"",
      usernameError:"",
      passwordError:"",
      emailError:""
    });
  }
  
  
});

app.post('/signup', (req, res) => 
{
    var cusname = req.body.cusname;
    var username =  req.body.username;
    var email = req.body.email;
    var password =  req.body.password;


    if(cusname=="")
    {
      var cusnameerr={cusnameerr:"PLEASE FILL IN YOUR NAME"};
      res.end(JSON.stringify(cusnameerr));
    }
    else if(email=="")
    {
      var emailerr={emailerr:"PLEASE FILL IN YOUR EMAIL"};
      res.end(JSON.stringify(emailerr));
    }
    else if(username=="")
    {
      var usernameerr={usernameerr:"PLEASE FILL IN YOUR USERNAME"};
      res.end(JSON.stringify(usernameerr));
    }
    else if(password=="")
    {
      var passworderr={passworderr:"PLEASE FILL IN YOUR PASSWORD"};
      res.end(JSON.stringify(passworderr));
    }
    else
    {
      readUsersFromFile(function(users)
      {
        var err = 0;
          var exixting_user = users.filter(function(user)
          {
              if(user.username === username)
              {
                err=1;
                return true;
              }
              if(user.email === email)
              {
                err=2;
                return true;
              }
          })

          if(exixting_user.length)
          {
            if(err == 1)
            {
              var usernameerr={usernameerr:"USER ALREADY EXISTS"};
              res.end(JSON.stringify(usernameerr));
            }
            else if(err == 2)
            {
              var emailerr={emailerr:"EMAIL ALREADY EXISTS"};
              res.end(JSON.stringify(emailerr));
            }
          }
          else
          {
              users.push({
                  cusname:cusname,
                  email:email,
                  username:username,
                  password: password,
                  is_verified:false,
                  verification_key:"verificationKeyForSignup",
                  isAdmin: false
              });

              saveUser(JSON.stringify(users),function(err)
              {
                  if(err)
                  {
                    var usernameerr="UNABLE TO CREATE USER. PLEASE TRY AGAIN";
                    console.log(err);
                    res.end(JSON.stringify(usernameerr));
                  }
                  else
                  {
                      console.log("user inserted");

                      const token = createToken(cusname, username, false);
                      res.cookie('jwt',token);
                      sendVerificationMail("verificationKeyForSignup", email, cusname);
                      var user={"user":"USER FOUND"};
                      res.end(JSON.stringify(user));

                  }
              })
          }
      });
    }

    

})


app.post('/login', (req, res) => 
{
    var username =  req.body.username;
    var password =  req.body.password;
    var err;

    if(username == "")
    {
      err={"error":"ENTER USERNAME"};
      res.end(JSON.stringify(err));
    }
    else if(password == "")
    {
      err={"error":"ENTER PASSWORD"};
      res.end(JSON.stringify(err));
    }
    else
    {
      
      readUsersFromFile(function(users)
      {
          var found_user;
          var exixting_user = users.filter(function(user)
              {
                  if(user.username === username && user.password === password)
                  {
                      found_user = user;
                      return true;
                  }
              })
              if(!exixting_user.length)
              {
                  err={"error":"USER NOT FOUND"};
                  res.end(JSON.stringify(err));
              }
              else
              {
                  
                  const token = createToken(found_user.cusname, found_user.username, found_user.isAdmin);
                  res.cookie('jwt',token);
                  var user={"user":"USER FOUND"};
                  res.end(JSON.stringify(user));
                  
              }
      });

    }

    

})




app.get("/verify_account", function(req, res)
{
  
  console.log("token, email");
    var token = req.query.verification_key;
    var email = req.query.email;
    readUsersFromFile(function(users){
      users.filter(function(user)
      {
      if(user.email == email)
      {
        if(user.verification_key == token)
        {
          user.is_verified = true;
          saveUser(JSON.stringify(users), (err)=>{
            console.log(err);
          });
          res.end("VERIFICATION COMPLETED. PLEASE HEAD BACK TO HOME");
          return true;
          
        }
        else
        {
          res.end("VERIFICATION UNSUCCESSFUL. PLEASE CHECK LINK");
          return true;
        }
        
      }


      });
    });
})



function sendVerificationMail(token, email, cusname)
{
  const request = mailjet.post("send", {'version': 'v3.1'}).request({
  "Messages":[
    {
      "From": {
        "Email": "prithvij1600@gmail.com",
        "Name": "Admin"
      },
      "To": [
        {
          "Email": email,
          "Name": cusname
        }
      ],
      "Subject": "Verification email",
      "TextPart": "Verification email",
      "HTMLPart": "<h3>Dear "+cusname+", please click on this link to verify <a href='http://localhost:3000/verify_account?verification_key="+token+"&email="+email+"'>Verify your account</a>!</h3><br />",
      "CustomID": "AppGettingStartedTest"
    }
  ]
})

request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err)
  })

}





function readUsersFromFile(callback)
{
    fs.readFile("./users.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        callback(data);
    })
}

function saveUser(data,callback)
{
    fs.writeFile("./users.txt", data,function(err)
    {
        callback(err);
    });
}

function readProduct(callback)
{
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];
        var i = 0;
        var data_send = [];
        data.every(function(product, index)
        {
          data_send.push(product);
          i++
          if(i==5)
            return false;
          else
            return true;
        }); 

        callback(data_send);
    });
}


app.get('/getProducts', (req, res)=>{
  
  
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
          data  = data ? JSON.parse(data) : [];
          var i = 0;
          var data_send = [];
          data.every(function(product, index)
          {
            if(i>=displayedProducts)
            {
              data_send.push(product);
              
              i++
              if(i%5==0)
                return false;
              else
                return true;
            }
            else
            {
              i++;
              return true;
            }
              
          });
          displayedProducts=i;

          var removeLoadMore = true;
          if(displayedProducts%5==0)
            removeLoadMore = false;
          var obj={
            data:data_send,
            removeLoadMore:removeLoadMore
            
          };
          res.send(JSON.stringify(obj));

    }); 
  
});

app.post('/getDescription', (req, res)=>{
  const token = req.cookies.jwt;
  if(token)
  {
    jwt.verify(token, jwt_secret, (err, decodedToken)=>{
      readUsersFromFile((users)=>{
        users.filter((user)=>{
          if(user.username == decodedToken.username)
          {
            if(user.is_verified == true)
            {
              var id = parseInt(req.body.id);
  
              fs.readFile("./products.txt","utf-8", function(err, data)
                {
                    data  = data ? JSON.parse(data) : [];
                    data.every(function(product, index)
                    {
                      if(product.id == id)
                      {
                        if(product.description == "")
                          product.description = "No description found";
                        res.end(JSON.stringify(product));
                        return false;
                      }
                      
                      else
                        return true;
                    });
                });
            }
            else
            {
              res.end(JSON.stringify({"error":"PLEASE VERIFY ACCOUNT TO CONTINUE"}));
            }
            return true;
          }
        });
      });
    });
    
  }
  else
  {
    res.end(JSON.stringify({"error":"PLEASE LOG IN TO CONTINUE"}));
  }
  
  
});

app.get('/changepassword', (req, res)=>{
  res.render('changepassword');
  
});

app.post('/sendChangePasswordLink', (req, res)=>{
  var email = req.body.email;
  if(email)
  {
    readUsersFromFile((users)=>{
      var totalUsers = users.filter((user)=>{
        if(user.email == email)
        {

          const request = mailjet.post("send", {'version': 'v3.1'}).request({
            "Messages":[
              {
                "From": {
                  "Email": "prithvij1600@gmail.com",
                  "Name": "Admin"
                },
                "To": [
                  {
                    "Email": user.email,
                    "Name": user.cusname
                  }
                ],
                "Subject": "Verification email",
                "TextPart": "Verification email",
                "HTMLPart": "<h3>Dear "+user.cusname+", please click on this link to reset password <a href='http://localhost:3000/resetPassword?email="+email+"'>Reset Password</a>!</h3><br />",
                "CustomID": "AppGettingStartedTest"
              }
            ]
          })
          
          request
            .then((result) => {
              console.log(result.body)
            })
            .catch((err) => {
              console.log(err)
            })
          

          res.end(JSON.stringify({user:"PASSWORD REST LINK SENT"}));
          return true;
        }
      });
      if(!totalUsers.length)
      {
        res.end(JSON.stringify({emailerr:"THIS IS NOT A REGISTERED EMAIL"}));
      }
    });
  }
  else
  {
    res.end(JSON.stringify({emailerr:"ENTER AN EMAIL"}));
  }
});

app.get('/resetPassword', (req, res)=>{
  var email = req.query.email;
  res.render('resetPassword', {email:email});

});

app.post('/resetingPassword', (req, res)=>{
  var password = req.body.password;
  var email = req.body.email;
  if(password)
  {
    readUsersFromFile((users)=>{
      users.every((user)=>{
        if(user.email == email)
        {
          user.password = password;
          return false;
        }
        else
          return true;
      });
      saveUser(JSON.stringify(users), (err)=>{
        if(err)
          res.end(JSON.stringify({emailerr:"ERROR RESETING PASSWORD"}));
        else
          res.end(JSON.stringify({user:"PASSWORD IS RESET"}));
      });
    });
  }
  else
  {
    res.end(JSON.stringify({emailerr:"ENTER A PASSWORD"}));
  }

});

const createToken = (cusname, username, isAdmin)=>{
  return jwt.sign({ username: username, cusname: cusname, isAdmin: isAdmin }, jwt_secret, { expiresIn : 60*60*24});
}

app.post('/addtocart', (req, res)=>{
  var id = req.body.id;
  fs.readFile("./cart.txt","utf-8", function(err, data)
    {
      var foundProduct = false;
        data  = data ? JSON.parse(data) : [];
        data.every((productId, index)=>
        {
          
          if(id == productId)
          {
            foundProduct = true;
            return false;
          }
          else
          {
            return true;
          }
            
        });
        if(foundProduct != true)
        {
            
          data.push(id);
          fs.writeFile('./cart.txt' ,JSON.stringify(data), (err)=>
          {
            res.end(JSON.stringify(err));
          });
        }
        else
        {
          res.end(JSON.stringify("already in cart"));
        }

    });
});

app.get('/viewcart', (req, res)=>{
  fs.readFile("./cart.txt","utf-8", function(err, cart_data){
    cart_data = cart_data ? JSON.parse(cart_data) : [];
    var productsToBeSent = [];
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];
        cart_data.every(function(id, idindex){
          data.every(function(product, index)
          {
            if(product.id == id)
            {
              if(product.description == "")
                product.description = "No description found";
              productsToBeSent.push(product);
              return false;
            }
            
            else
              return true;
          });
          return true;
        });
        let token = req.cookies.jwt;
        if(token)
        {
          jwt.verify(token, jwt_secret, (err, decodedToken)=>{
            res.render("cart",{
              header:'loggedInHeader',
              link: '/',
              linktext: 'HOME',
              cusname: decodedToken.cusname,
              isAdmin: decodedToken.isAdmin,
              products: productsToBeSent
            });
          });
        }
    });
    
  });

});


app.get('/manageproducts', (req, res)=>
{
  fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];
        let token = req.cookies.jwt;
      if(token)
      {
        jwt.verify(token, jwt_secret, (err, decodedToken)=>{
          res.render("manageproducts",{
            header:'loggedInHeader',
            link: '/',
            linktext: 'HOME',
            cusname: decodedToken.cusname,
            isAdmin: false,
            products: data
          });
        });
      } 
    });
  
});


app.post('/removefromcart', (req, res)=>{
  var id = req.body.id;
  
  fs.readFile("./cart.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];
        data.every((productId, index)=>
        {
          
          if(id == productId)
          {
            data.splice(index, 1);
            console.log(data);
            fs.writeFile('./cart.txt' ,JSON.stringify(data), (err)=>
            {
              res.end(JSON.stringify(err));
            });
            return false;
          }
          return true;
        });
        
    });
});

app.post('/removeproduct', (req, res)=>{
  var id = req.body.id;
  fs.readFile("./products.txt","utf-8", function(err, data){
    data = data ? JSON.parse(data) : [];
    data.every((product, index)=>
        {
          
          if(id == product.id)
          {
            data.splice(index, 1);
            console.log(data);
            fs.writeFile('./products.txt' ,JSON.stringify(data), (err)=>
            {
              res.end(JSON.stringify(err));
            });
            return false;
          }
          return true;
        });
  });
});

app.post('/addproduct', upload.single("image"), (req, res)=>{
  var obj = req.body;
  var filename = req.file.filename;
  console.log(obj);
  fs.readFile("./products.txt","utf-8", function(err, data){
    data = data ? JSON.parse(data) : [];
    var prod = {};
    prod.id = parseInt(data[data.length-1].id)+1;
    prod.title = obj.title;
    prod.description = obj.desc;
    prod.image = filename;
    prod.class = "cardsImage";
    prod.orientation = "";
    prod.stock = obj.stock;
    prod.price = obj.price;
    data.push(prod);
    fs.writeFile('./products.txt' ,JSON.stringify(data), (err)=>
    {
      res.end(JSON.stringify(err));
    });
  });
});

app.post('/updateproduct', upload.single("image"), (req, res)=>{
  var obj = req.body;
  if(req.file)
    var filename = req.file.filename;
  console.log(obj);
  fs.readFile("./products.txt","utf-8", function(err, data){
    data = data ? JSON.parse(data) : [];
    data.every((prod, index)=>{
      if(prod.id == obj.id)
      {
        prod.title = obj.title;
        prod.description = obj.desc;
        if(req.file)
          prod.image = filename;
        prod.stock = obj.stock;
        prod.price = obj.price;
        return false;
      }
      return true;
    });
    
    
    fs.writeFile('./products.txt' ,JSON.stringify(data), (err)=>
    {
      res.end(JSON.stringify(err));
    });
  });
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});