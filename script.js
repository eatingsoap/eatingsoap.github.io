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

firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
var provider = new firebase.auth.GoogleAuthProvider();

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
  
  $("#login").off("click");
  $("#login").on("click", (evt)=>{
	firebase.auth().signInWithRedirect(provider);
	  firebase.auth()
	  .getRedirectResult()
	  .then((result) => {
	    if (result.credential) {
		  /** @type {firebase.auth.OAuthCredential} */
		  var credential = result.credential;

		  // This gives you a Google Access Token. You can use it to access the Google API.
		  var token = credential.accessToken;
		  // ...
		}
		// The signed-in user info.
		var user = result.user;
	  }).catch((error) => {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
		// The email of the user's account used.
		var email = error.email;
		// The firebase.auth.AuthCredential type that was used.
		var credential = error.credential;
		// ...
	});
  });
  
  $("#likebutton").off("click");
  $("#likebutton").on("click", (evt)=>{
    let ID = $(evt.currentTarget).attr("data-uuid");
    let likeRef = rtdb.ref(db, "/tweets/" + ID);
    rtdb.get(likeRef).then(ss=> {
      const tweetID = ss.val();
      let addLikes = parseInt(tweetID.likes) + 1;
      updateLikes(ID, tweetID, addLikes);
    });
  });
    
  $("#retweetbutton").off("click");
  $("#retweetbutton").on("click", (evt)=>{
    let ID = $(evt.currentTarget).attr("data-uuid");
    let retweetRef = rtdb.ref(db, "/tweets/" + ID);
    rtdb.get(retweetRef).then(ss=> {
      const tweetID = ss.val();
      let addRetweet = parseInt(tweetID.retweets) + 1;
      updateRetweets(ID, tweetID, addRetweet);
    });
  });
  
  $("#deletebutton").off("click");
  $("#deletebutton").on("click", (evt)=>{
    let ID = $(evt.currentTarget).attr("data-uuid");
    let deleteRef = rtdb.ref(db, "/tweets/" + ID);
    deleteTweet(deleteRef);
    history.go(0);
  });
});

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

let updateLikes = (ID, tweetID, newLikeCount)=> {
  let updatedTweet = {
    [ID]:{
      "author":{
        "handle": tweetID.author.handle,
        "pic": tweetID.author.pic
      },
      "content": tweetID.content,
      "likes": newLikeCount,
      "retweets": tweetID.retweets,
      "timestamp": tweetID.timestamp
    }
  };
  rtdb.update(tweetRef, updatedTweet);
}

let updateRetweets = (ID, tweetID, newRetweetCount)=> {
  let updatedTweet = {
    [ID]:{
      "author":{
        "handle": tweetID.author.handle,
        "pic": tweetID.author.pic
      },
      "content": tweetID.content,
      "likes": tweetID.likes,
      "retweets": newRetweetCount,
      "timestamp": tweetID.timestamp
    }
  };
  rtdb.update(tweetRef, updatedTweet);
}

let loggedin = ()=> {
  $("#login").hide();
  $("#createname").show();
  $("#logout").show();
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    var uid = user.uid;
    loggedin();
  } else {
    // User is signed out
    // ...
  }
});

$("#create").on('click', ()=>{
  $("#username").show();
  $("#image").show();
  $("#contents").show();
  $("#likes").show();
  $("#retweets").show();
  $("#send").show();
  firebase.auth().signOut();
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