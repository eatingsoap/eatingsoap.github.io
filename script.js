import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.9.4/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfApFbypih66jEmAavt6GB3uK1AUQH_ZI",
  authDomain: "test-a8311.firebaseapp.com",
  databaseURL: "https://test-a8311-default-rtdb.firebaseio.com",
  projectId: "test-a8311",
  storageBucket: "test-a8311.appspot.com",
  messagingSenderId: "216412550524",
  appId: "1:216412550524:web:28f675fbb043296a0ea0f9"
};

const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
var provider = new firebase.auth.GoogleAuthProvider();

firebase.initializeApp(firebaseConfig);
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    $("#mainpage").hide();
    $("#loginpage").show();
    
    $("#login").on("click", (evt)=>{
      firebase.auth().signInWithRedirect(provider);
    });
  } else {
    $("mainpage").show();
    $("#loginpage").hide();
    loggedin(user);
  }
});

let loggedin = (user)=> {
  $("#login").hide();
  $("#edit").show();
  $("#logout").show();

  let myuid = user.uid;
  var userRef = firebase.database().ref().child("/users").child(myuid);
  userRef.get().then((ss) => {
    let userData = ss.val();
    if(!userData){
      let userHandle = user.displayName;
      let userImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png";
      $("#loggeduser").prepend(`<img width="150" height="150" src=${userImage}></img>`)
      $("#loggeduser").prepend(`<h6><font color="#05dbfc">Logged in as: ${userHandle}</h6>`);
    }
    else{
      $("#loggeduser").prepend(`<img width="150" height="150" src=${userData.pic}></img>`)
      $("#loggeduser").prepend(`<h6><font color="#05dbfc">Logged in as: ${userData.handle}</h6>`);
    }
  });

  $("#createname").on('click', ()=>{
    let name = prompt("Please enter your new username", "");
    if (name == null || name == "") {
      alert("Username not changed");
    } 
    if (name.length > 25){
      alert("Username too long, must be shorter than 25 characters");
    } 
    else {
      name = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      userRef.child("handle").set(name);
      history.go(0);
    }
  })

  $("#userimage").on('click', ()=>{
    let image = prompt("Please enter a link to an image", "");
    if (image == null || image == "") {
      alert("Image not changed");
    } else {
      image = image.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      userRef.child("pic").set(image);
      history.go(0);
    }
  })
}

let renderTweet = (tObj,uuid)=>{
  let userID = tObj.authorID;
  //var user = firebase.auth().currentUser;
  var userRef = firebase.database().ref().child("/users").child(userID);
  userRef.get().then((ss) => {
    let userData = ss.val();
    if(userData){
      let userData = ss.val();
      var userHandle = userData.handle;
      var userImage = userData.pic;
    }
    $("#alltweets").prepend(`
<div class="card mb-3 tweet column2" data-uuid="${uuid}" style="max-width: 700px;max-height: 500px;min-height: 250px">
  <div class="row g-0">
    <div class="col-md-4">
      <img width="150" height="150" src="${userImage}" class="img-fluid rounded-start" alt="...">
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">${userHandle}</h5>
        <p class="card-text">${tObj.content}</p>
        <h6 class="card-text" id="likeRetweet${uuid}"><small>Likes: ${tObj.likes} Retweets: ${tObj.retweets}</small></h6>
        <p class="card-text"><small class="text-muted">Tweeted at ${new Date(tObj.timestamp).toLocaleString()}</small></p>
        <div id="buttons-${uuid}">
          <button style="background-color:#f04337" id="likebutton" href="#" class="btn btn-primary like button" data-uuid="${uuid}">Like</button>
          <button style="background-color:#23ba3a" id="retweetbutton" href="#" class="btn btn-primary retweet button" data-uuid="${uuid}">Retweet</button>
        </div>
      </div>
    </div>
  </div>
</div>
  `);
  const currentUser = firebase.auth().currentUser;
  
  $("#likebutton").off("click");
  $("#likebutton").on("click", (evt) => {
    let ID = $(evt.currentTarget).attr("data-uuid");
    let likeRef = firebase.database().ref("/tweets").child(ID);
    toggleLike(likeRef, currentUser.uid);
  });
    
  $("#retweetbutton").off("click");
  $("#retweetbutton").on("click", (evt) => {
    let ID = $(evt.currentTarget).attr("data-uuid");
    let retweetRef = firebase.database().ref("/tweets").child(ID);
    toggleRetweet(retweetRef, currentUser.uid);
  });
  
  if(currentUser.uid==userID){
    $("#buttons-"+uuid).append(`<button style="background-color:black" id="deletebutton" href="#" class="btn btn-primary delete button" class="align-right" data-uuid="${uuid}">Delete</button>`);
  }

  $("#deletebutton").off("click");
  $("#deletebutton").on("click", (evt) => {
    let ID = $(evt.currentTarget).attr("data-uuid");
    let authorID = currentUser.uid;
    let deleteRef = rtdb.ref(db, "/tweets/" + ID);
    let authorDeleteRef = rtdb.ref(db, "/users/" + authorID + "/tweets/" + ID);
    rtdb.remove(deleteRef);
    rtdb.remove(authorDeleteRef);
    history.go(0);
  });
  });
}

let tweetRef = rtdb.ref(db, "/tweets");

rtdb.onChildAdded(tweetRef, (ss)=>{
  let tObj = ss.val();
  renderTweet(tObj, ss.key);
});

let toggleLike = (tweetRef, uid)=> {
  tweetRef.transaction((tObj) => {
    if (tObj) {
      if (tObj.likes && tObj.liked_by_user[uid]) {
        tObj.likes--;
        tObj.liked_by_user[uid] = null;
      } else {
        tObj.likes++;
        if (!tObj.liked_by_user) {
          tObj.liked_by_user = {};
        }
        tObj.liked_by_user[uid] = true;
      }
    }
    return tObj;
  });
}

let toggleRetweet = (tweetRef, uid)=> {
  tweetRef.transaction((tObj) => {
    if (tObj) {
      if (tObj.retweets && tObj.retweeted_by_user[uid]) {
        tObj.retweets--;
        tObj.retweeted_by_user[uid] = null;
      } else {
        tObj.retweets++;
        if (!tObj.retweeted_by_user) {
          tObj.retweeted_by_user = {};
        }
        tObj.retweeted_by_user[uid] = true;
      }
    }
    return tObj;
  });
}

rtdb.onChildChanged(tweetRef, (ss)=>{
  let tObj = ss.val();
  let ID = ss.key;
  let newText = "Likes: " + tObj.likes + " Retweets: " + tObj.retweets;
  $("#likeRetweet" + [ID]).text(newText);
});

let createTweet = ()=>{
  const user = firebase.auth().currentUser;
  let contents = $("#contents").val() || "write something next time lol";
  contents = contents.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  let likes = 0;
  let retweets = 0;
  var myRef = firebase.database().ref().child("/tweets").push()
  var tweetID = myRef.key;
  const myObj = {
    "content": contents,
    "likes": likes,
    "retweets": retweets,
    "timestamp": new Date().getTime(),
    "authorID": user.uid
  };
  updateUser(user, tweetID);
  myRef.set(myObj);
}

let updateUser = (user, tweetRef) => {
  var userRef = firebase.database().ref().child("/users").child(user.uid);
  userRef.get().then((ss) => {
    let userdata = ss.val();
    if(!userdata){
      const newUser = {
        "handle": user.displayName,
        "pic": "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png",
        "tweets":{
          [tweetRef] : true,
        }
      };
      userRef.set(newUser);
    }
    else{
      const newTweet = {
        [tweetRef] : true,
      }
      userRef.child("/tweets").update(newTweet);
    }
  })
}

$("#edit").on('click', ()=>{
  if (document.getElementById("createname").style.display === "none"){
    $("#createname").show();
    $("#createnamediv").show();
    $("#userimage").show();
    $("#userimagediv").show();
  } else {
    $("#createname").hide();
    $("#createnamediv").hide();
    $("#userimage").hide();
    $("#userimagediv").hide();
  }
})

$("#logout").on('click', ()=>{
  firebase.auth().signOut();
  history.go(0);
})

$("#create").on('click', ()=>{
  if (document.getElementById("contents").style.display === "none"){
    $("#contents").show();
    $("#send").show();
  } else {
    $("#contents").hide();
    $("#send").hide();
  }
});

$("#send").on('click', ()=>{
  $("#contents").hide();
  $("#send").hide();
  createTweet();
  const inputs = document.querySelectorAll('#contents')
  inputs.forEach(input => {
    input.value = '';
  });
});