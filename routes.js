const passport = require("passport");
const bcrypt = require("bcrypt");

module.exports = function(app, db) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/");
  }

  app.get("/auth/github", passport.authenticate("github"));

  app
    .route("/auth/github/callback")
    .get(
      passport.authenticate("github", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  app.get("/", (req, res) => {
    //res.sendFile(process.cwd() + '/views/index.html');
    res.render("pug/index", {
      title: "Home page",
      message: "Please login!",
      showLogin: true,
      showRegistration: true
    });
  });

  app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/" }),
    function(req, res) {
      res.redirect("/profile");
    }
  );

  app.get("/profile", ensureAuthenticated, (req, res) => {
    res.render("pug/profile", { username: req.user.username });
  });

  app.route("/register").post(
    (req, res, next) => {
      db.collection("users").findOne(
        { username: req.body.username },
        (err, user) => {
          if (err) next(err);
          else if (user) {
            console.log("user already exists");
            res.redirect("/");
          } else {
            db.collection("users").insertOne(
              {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, 12)
              },
              (err, user) => {
                if (err) {
                  console.log("error adding user");
                  res.redirect("/");
                }
                console.log(
                  "user " + req.body.username + " added successfully"
                );
                next(null, user);
              }
            );
          }
        }
      );
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/profile");
    }
  );

  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("not found");
  });
};
