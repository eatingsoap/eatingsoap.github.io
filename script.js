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

  $("#createname").on('click', ()=>{
    let name = prompt("Please enter your new username", "");
    if (name == null || name == "") {
      alert("Username not changed");
    } else {
      rtdb.set(rtdb.ref(db, 'users/' + myuid), {
        "username": name
      });
    }
  })

  $("#userimage").on('click', ()=>{
    let image = prompt("Please enter a link to an image", "");
    if (image == null || image == "") {
      alert("Image not changed");
    } else {
      //rtdb.remove(rtdb.ref(db, 'profilepictures/', myuid));
      //let pfpRef = rtdb.ref(db, "profilepictures/" + myuid);
      //alert(pfpRef);
      rtdb.set(rtdb.ref(db, 'profilepictures/' + myuid), {
        "userimage": image
      });
      /*$("#userimage").append(`
        <img id="pfp" class="hidden" src="${pfpRef}" class="img-fluid rounded-start" alt="..." width="100" height="100">
      `)*/
    }
  })
}

let renderTweet = (tObj,uuid)=>{
  $("#alltweets").prepend(`
<div class="card mb-3 tweet column2" data-uuid="${uuid}" style="max-width: 500px;">
  <div class="row g-0">
    <div class="col-md-4">
      <img src="${tObj.author.pic}" class="img-fluid rounded-start" alt="...">
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">${tObj.author.handle}</h5>
        <p class="card-text">${tObj.content}</p>
        <p class="card-text" id="likeRetweet${uuid}">Likes: ${tObj.likes} Retweets: ${tObj.retweets}</p>
        <p class="card-text"><small class="text-muted">Tweeted at ${new Date(tObj.timestamp).toLocaleString()}</small></p>
        <button style="background-color:#f04337" id="likebutton" href="#" class="btn btn-primary like button" data-uuid="${uuid}">Like</button>
        <button style="background-color:#23ba3a" id="retweetbutton" href="#" class="btn btn-primary retweet button" data-uuid="${uuid}">Retweet</button>
        <button style="background-color:black" id="deletebutton" href="#" class="btn btn-primary delete button" class="align-right" data-uuid="${uuid}">Delete</button>
      </div>
    </div>
  </div>
</div>
  `);
}

let tweetRef = rtdb.ref(db, "/tweets");

rtdb.onChildAdded(tweetRef, (ss)=>{
  let tObj = ss.val();
  renderTweet(tObj, ss.key);
  const currentUser = firebase.auth().currentUser;
  
  $("#likebutton").off("click");
  $("#likebutton").on("click", (evt)=>{
    let ID = $(evt.currentTarget).attr("data-uuid");
    let likeRef = firebase.database().ref("/tweets").child(ID);
    toggleLike(likeRef, currentUser.uid);
  });
    
  $("#retweetbutton").off("click");
  $("#retweetbutton").on("click", (evt)=>{
    let ID = $(evt.currentTarget).attr("data-uuid");
    let retweetRef = firebase.database().ref("/tweets").child(ID);
    toggleRetweet(retweetRef, currentUser.uid);
  });
  
  $("#deletebutton").off("click");
  $("#deletebutton").on("click", (evt)=>{
    let ID = $(evt.currentTarget).attr("data-uuid");
    let deleteRef = firebase.database().ref("/tweets").child(ID);
    //if(deleteRef)
    deleteTweet(deleteRef);
    history.go(0);
  });
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
  let username = $("#username").val() || "nobody";
  let image = $("#image").val() || "https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png";
  let contents = $("#contents").val() || "write something next time lol";
  let likes = $("#likes").val() || 0;
  let retweets = $("#retweets").val() || 0;
  const myObj = {
    "author": {
      "handle": username,
      "pic": image
    },
    "content": contents,
    "likes": likes,
    "retweets": retweets,
    "timestamp": new Date().getTime()
  };
  rtdb.push(tweetRef, myObj);
}

let deleteTweet = (deleteRef)=>{
  rtdb.remove(deleteRef);
}

$("#edit").on('click', ()=>{
  if (document.getElementById("createname").style.display === "none"){
    $("#createname").show();
    $("#userimage").show();
  } else {
    $("#createname").hide();
    $("#userimage").hide();
  }
})

$("#logout").on('click', ()=>{
  firebase.auth().signOut();
  history.go(0);
})

$("#create").on('click', ()=>{
  if (document.getElementById("username").style.display === "none"){
    $("#username").show();
    $("#image").show();
    $("#contents").show();
    $("#likes").show();
    $("#retweets").show();
    $("#send").show();
  } else {
    $("#username").hide();
    $("#image").hide();
    $("#contents").hide();
    $("#likes").hide();
    $("#retweets").hide();
    $("#send").hide();
  }
});

$("#send").on('click', ()=>{
  $("#username").hide();
  $("#image").hide();
  $("#contents").hide();
  $("#likes").hide();
  $("#retweets").hide();
  $("#send").hide();
  createTweet();
  const inputs = document.querySelectorAll('#username, #image, #contents, #likes, #retweets')
  inputs.forEach(input => {
    input.value = '';
  });
});