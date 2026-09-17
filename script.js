/* =========================================================
   LINKJO — SCRIPT PRINCIPAL
   Firebase Authentication + Firestore + Cloudinary
   ========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   1. CONFIGURATION FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDMLdkIChVNq_Jq5PuxVv1l3n2YXflHpAs",
  authDomain: "friendlink-1a3a4.firebaseapp.com",
  projectId: "friendlink-1a3a4",
  storageBucket: "friendlink-1a3a4.firebasestorage.app",
  messagingSenderId: "592455346481",
  appId: "1:592455346481:web:4e14985f7f7c1a9a8fa810",
  measurementId: "G-7KGM7BKHG6"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   2. CONFIGURATION CLOUDINARY
   ========================================================= */

const CLOUDINARY_CLOUD_NAME = "tmpquqol";

const CLOUDINARY_UPLOAD_PRESET = "linkjo_upload";


/* =========================================================
   3. OUTILS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function currentUser() {
  return auth.currentUser;
}

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showMessage(element, text, type = "error") {

  if (!element) return;

  element.textContent = text;

  element.className = type;

  setTimeout(() => {

    if (element) {
      element.textContent = "";
    }

  }, 5000);
}


/* =========================================================
   4. GESTION DES ÉCRANS
   ========================================================= */

const screens = [
  "loginScreen",
  "homeScreen",
  "statusScreen",
  "friendsScreen",
  "profileScreen",
  "chatScreen"
];


function showOnly(screenId) {

  screens.forEach(id => {

    const screen = $(id);

    if (!screen) return;

    if (id === screenId) {

      screen.classList.remove("hidden");

      screen.style.display = "";

    } else {

      screen.classList.add("hidden");

      screen.style.display = "none";
    }

  });
}


/* =========================================================
   5. NAVIGATION
   ========================================================= */

window.showLogin = function () {

  showOnly("loginScreen");

};


window.showHome = async function () {

  if (!currentUser()) {

    showOnly("loginScreen");

    return;
  }

  showOnly("homeScreen");

  await loadUsers();

};


window.showStatus = async function () {

  if (!currentUser()) {

    showOnly("loginScreen");

    return;
  }

  showOnly("statusScreen");

  await loadStatuses();

};


window.showFriends = async function () {

  if (!currentUser()) {

    showOnly("loginScreen");

    return;
  }

  showOnly("friendsScreen");

  await loadFriends();

};


window.showProfile = async function () {

  if (!currentUser()) {

    showOnly("loginScreen");

    return;
  }

  showOnly("profileScreen");

  await loadProfile();

};


window.closeChat = function () {

  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;
  }

  showOnly("homeScreen");

  loadUsers();

};


/* =========================================================
   6. CONNEXION / INSCRIPTION
   ========================================================= */

let registerMode = false;

const authForm = $("authForm");

const switchAuth = $("switchAuth");


function updateAuthMode() {

  const title = $("authTitle");

  const button = $("authButton");

  const nameInput = $("nameInput");

  const usernameInput = $("usernameInput");

  const message = $("authMessage");


  if (message) {

    message.textContent = "";

  }


  if (registerMode) {

    if (title) {
      title.textContent = "Créer un compte";
    }

    if (button) {
      button.textContent = "Créer mon compte";
    }

    if (switchAuth) {
      switchAuth.textContent = "J’ai déjà un compte";
    }

    if (nameInput) {
      nameInput.classList.remove("hidden");
      nameInput.required = true;
    }

    if (usernameInput) {
      usernameInput.classList.remove("hidden");
      usernameInput.required = true;
    }

  } else {

    if (title) {
      title.textContent = "Connexion";
    }

    if (button) {
      button.textContent = "Se connecter";
    }

    if (switchAuth) {
      switchAuth.textContent = "Créer un compte";
    }

    if (nameInput) {
      nameInput.classList.add("hidden");
      nameInput.required = false;
    }

    if (usernameInput) {
      usernameInput.classList.add("hidden");
      usernameInput.required = false;
    }

  }
}


if (switchAuth) {

  switchAuth.addEventListener("click", () => {

    registerMode = !registerMode;

    updateAuthMode();

  });

}


if (authForm) {

  authForm.addEventListener("submit", async event => {

    event.preventDefault();


    const email =
      $("emailInput")?.value.trim() || "";

    const password =
      $("passwordInput")?.value || "";

    const name =
      $("nameInput")?.value.trim() || "";

    const username =
      $("usernameInput")?.value.trim() || "";


    const message = $("authMessage");

    const button = $("authButton");


    if (!email || !password) {

      showMessage(
        message,
        "Remplis ton adresse email et ton mot de passe."
      );

      return;
    }


    if (registerMode && (!name || !username)) {

      showMessage(
        message,
        "Remplis ton nom et ton pseudo."
      );

      return;
    }


    if (password.length < 6) {

      showMessage(
        message,
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }


    if (button) {

      button.disabled = true;

      button.textContent =
        registerMode
          ? "Création..."
          : "Connexion...";
    }


    try {

      if (registerMode) {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        const user = result.user;


        await updateProfile(
          user,
          {
            displayName: name
          }
        );


        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            name: name,
            username: username,
            email: email,
            photoURL: "",
            createdAt: serverTimestamp()
          },
          {
            merge: true
          }
        );


        if (message) {

          message.textContent =
            "Compte créé avec succès !";

          message.className = "success";
        }


        registerMode = false;

        updateAuthMode();


        showOnly("homeScreen");

        await loadUsers();


      } else {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        showOnly("homeScreen");

        await loadUsers();

      }


    } catch (error) {

      console.error(
        "Erreur authentification :",
        error
      );


      let text =
        "Une erreur est survenue.";


      if (
        error.code ===
        "auth/invalid-credential"
      ) {

        text =
          "Email ou mot de passe incorrect.";
      }


      if (
        error.code ===
        "auth/user-not-found"
      ) {

        text =
          "Aucun compte ne correspond à cet email.";
      }


      if (
        error.code ===
        "auth/wrong-password"
      ) {

        text =
          "Mot de passe incorrect.";
      }


      if (
        error.code ===
        "auth/email-already-in-use"
      ) {

        text =
          "Cette adresse email est déjà utilisée.";
      }


      if (
        error.code ===
        "auth/invalid-email"
      ) {

        text =
          "Adresse email invalide.";
      }


      if (
        error.code ===
        "auth/weak-password"
      ) {

        text =
          "Le mot de passe est trop faible.";
      }


      if (
        error.code ===
        "auth/network-request-failed"
      ) {

        text =
          "Problème de connexion Internet.";
      }


      if (
        error.code ===
        "permission-denied" ||
        error.code ===
        "firestore/permission-denied"
      ) {

        text =
          "Firebase refuse l'accès à Firestore. Vérifie les règles Firestore.";
      }


      showMessage(
        message,
        text
      );


    } finally {

      if (button) {

        button.disabled = false;

      }

      updateAuthMode();

    }

  });

}


/* =========================================================
   7. UTILISATEURS
   ========================================================= */

async function loadUsers() {

  const list = $("usersList");

  if (!list) return;


  const user = currentUser();

  if (!user) {

    list.innerHTML = "";

    return;
  }


  list.innerHTML =
    '<div class="loading">Chargement...</div>';


  try {

    const snapshot =
      await getDocs(
        collection(db, "users")
      );


    let html = "";


    snapshot.forEach(userDoc => {

      const data = userDoc.data();


      if (userDoc.id === user.uid) {
        return;
      }


      const name =
        data.name ||
        data.username ||
        data.email ||
        "Utilisateur";


      const username =
        data.username || "";


      html += `

        <div class="user-card">

          <strong>
            ${escapeHTML(name)}
          </strong>

          ${
            username
              ? `<p>@${escapeHTML(username)}</p>`
              : `<p>${escapeHTML(data.email || "")}</p>`
          }

          <button
            type="button"
            onclick="showChat(
              '${escapeHTML(userDoc.id)}',
              '${escapeHTML(name)}',
              '${escapeHTML(data.email || "")}'
            )"
          >
            💬 Envoyer un message
          </button>

        </div>

      `;

    });


    list.innerHTML =
      html ||
      '<div class="empty-message">Aucun autre utilisateur pour le moment.</div>';


  } catch (error) {

    console.error(
      "Erreur utilisateurs :",
      error
    );


    list.innerHTML =
      '<div class="error">Impossible de charger les utilisateurs.</div>';

  }

}


/* =========================================================
   8. AMIS / RECHERCHE
   ========================================================= */

async function loadFriends(searchText = "") {

  const list = $("friendsList");

  if (!list) return;


  const user = currentUser();

  if (!user) return;


  list.innerHTML =
    '<div class="loading">Chargement...</div>';


  try {

    const snapshot =
      await getDocs(
        collection(db, "users")
      );


    const search =
      searchText.toLowerCase().trim();


    let html = "";


    snapshot.forEach(userDoc => {

      if (userDoc.id === user.uid) {
        return;
      }


      const data = userDoc.data();


      const name =
        data.name || "";

      const username =
        data.username || "";

      const email =
        data.email || "";


      const combined =
        `${name} ${username} ${email}`.toLowerCase();


      if (
        search &&
        !combined.includes(search)
      ) {

        return;
      }


      const displayName =
        name ||
        username ||
        email ||
        "Utilisateur";


      html += `

        <div class="user-card">

          <strong>
            ${escapeHTML(displayName)}
          </strong>

          ${
            username
              ? `<p>@${escapeHTML(username)}</p>`
              : `<p>${escapeHTML(email)}</p>`
          }

          <button
            type="button"
            onclick="showChat(
              '${escapeHTML(userDoc.id)}',
              '${escapeHTML(displayName)}',
              '${escapeHTML(email)}'
            )"
          >
            💬 Envoyer un message
          </button>

        </div>

      `;

    });


    list.innerHTML =
      html ||
      '<div class="empty-message">Aucun résultat.</div>';


  } catch (error) {

    console.error(
      "Erreur amis :",
      error
    );


    list.innerHTML =
      '<div class="error">Impossible de charger cette liste.</div>';

  }

}


window.searchFriends = async function () {

  const input =
    $("friendsSearchInput");


  await loadFriends(
    input ? input.value : ""
  );

};


const friendsSearchButton =
  $("friendsSearchButton");


if (friendsSearchButton) {

  friendsSearchButton.addEventListener(
    "click",
    window.searchFriends
  );

}


const friendsSearchInput =
  $("friendsSearchInput");


if (friendsSearchInput) {

  friendsSearchInput.addEventListener(
    "input",
    () => {

      loadFriends(
        friendsSearchInput.value
      );

    }
  );

}


/* =========================================================
   9. PROFIL
   ========================================================= */

async function loadProfile() {

  const user =
    currentUser();


  if (!user) return;


  const nameElement =
    $("profileName");

  const usernameElement =
    $("profileUsername");

  const emailElement =
    $("profileEmail");

  const uidElement =
    $("profileUid");

  const photoElement =
    $("profilePhoto");


  if (nameElement) {

    nameElement.textContent =
      user.displayName ||
      "Utilisateur";

  }


  if (emailElement) {

    emailElement.textContent =
      user.email || "";

  }


  if (uidElement) {

    uidElement.textContent =
      user.uid;

  }


  if (
    photoElement &&
    user.photoURL
  ) {

    photoElement.src =
      user.photoURL;

  }


  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );


    const userSnap =
      await getDoc(userRef);


    if (userSnap.exists()) {

      const data =
        userSnap.data();


      if (nameElement) {

        nameElement.textContent =
          data.name ||
          user.displayName ||
          "Utilisateur";

      }


      if (usernameElement) {

        usernameElement.textContent =
          data.username
            ? "@" + data.username
            : "";

      }


      if (
        photoElement &&
        data.photoURL
      ) {

        photoElement.src =
          data.photoURL;

      }

    }


  } catch (error) {

    console.error(
      "Erreur profil :",
      error
    );

  }

}


/* =========================================================
   10. PHOTO DE PROFIL
   ========================================================= */

window.chooseProfilePhoto = function () {

  const input =
    $("profilePhotoInput");


  if (input) {

    input.value = "";

    input.click();

  }

};


const profilePhotoInput =
  $("profilePhotoInput");


if (profilePhotoInput) {

  profilePhotoInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      if (!file) return;


      const user =
        currentUser();


      if (!user) {

        alert(
          "Connecte-toi d'abord."
        );

        return;
      }


      if (!file.type.startsWith("image/")) {

        alert(
          "Sélectionne une image."
        );

        return;
      }


      try {

        alert(
          "Envoi de la photo..."
        );


        const photoURL =
          await uploadToCloudinary(
            file
          );


        await updateProfile(
          user,
          {
            photoURL:
              photoURL
          }
        );


        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            photoURL:
              photoURL
          },
          {
            merge: true
          }
        );


        const profilePhoto =
          $("profilePhoto");


        if (profilePhoto) {

          profilePhoto.src =
            photoURL;

        }


        alert(
          "Photo de profil mise à jour !"
        );


      } catch (error) {

        console.error(
          "Erreur photo profil :",
          error
        );


        alert(
          "Impossible de mettre la photo de profil : " +
          error.message
        );

      }

    }
  );

}


/* =========================================================
   11. DÉCONNEXION
   ========================================================= */

window.logout = async function () {

  try {

    if (unsubscribeMessages) {

      unsubscribeMessages();

      unsubscribeMessages = null;

    }


    await signOut(auth);


    window.currentChatUser =
      null;


    registerMode =
      false;


    updateAuthMode();


    showOnly(
      "loginScreen"
    );


  } catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );


    alert(
      "Impossible de se déconnecter."
    );

  }

};


/* =========================================================
   12. DISCUSSION
   ========================================================= */

window.currentChatUser =
  null;


let unsubscribeMessages =
  null;


window.showChat = function (
  friendId,
  friendName,
  friendEmail
) {

  if (!currentUser()) {

    showOnly(
      "loginScreen"
    );

    return;
  }


  if (!friendId) return;


  showOnly(
    "chatScreen"
  );


  window.currentChatUser = {

    id: friendId,

    name:
      friendName || "",

    email:
      friendEmail || ""

  };


  const title =
    $("chatTitle");


  if (title) {

    title.textContent =
      friendName ||
      friendEmail ||
      "Discussion";

  }


  loadMessages(
    friendId
  );

};


/* =========================================================
   13. ENVOI DE MESSAGES
   ========================================================= */

const messageForm =
  $("messageForm");


if (messageForm) {

  messageForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const user =
        currentUser();


      const target =
        window.currentChatUser;


      const input =
        $("messageInput");


      if (
        !user ||
        !target ||
        !input
      ) {

        return;
      }


      const text =
        input.value.trim();


      if (!text) return;


      try {

        await addDoc(
          collection(
            db,
            "messages"
          ),
          {

            senderId:
              user.uid,

            senderEmail:
              user.email || "",

            receiverId:
              target.id,

            receiverEmail:
              target.email || "",

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );


        input.value =
          "";


        input.focus();


      } catch (error) {

        console.error(
          "Erreur envoi message :",
          error
        );


        alert(
          "Impossible d'envoyer le message. Vérifie les règles Firestore."
        );

      }

    }
  );

}


/* =========================================================
   14. CHARGEMENT DES MESSAGES
   ========================================================= */

function loadMessages(
  friendId
) {

  const messagesBox =
    $("messages");


  const user =
    currentUser();


  if (
    !messagesBox ||
    !user ||
    !friendId
  ) {

    return;
  }


  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages =
      null;

  }


  messagesBox.innerHTML =
    '<div class="loading">Chargement des messages...</div>';


  const sentQuery =
    query(
      collection(
        db,
        "messages"
      ),
      where(
        "senderId",
        "==",
        user.uid
      ),
      where(
        "receiverId",
        "==",
        friendId
      )
    );


  const receivedQuery =
    query(
      collection(
        db,
        "messages"
      ),
      where(
        "senderId",
        "==",
        friendId
      ),
      where(
        "receiverId",
        "==",
        user.uid
      )
    );


  let sentMessages =
    [];


  let receivedMessages =
    [];


  function displayMessages() {

    const allMessages =
      [
        ...sentMessages,
        ...receivedMessages
      ];


    allMessages.sort(
      (a, b) => {

        const dateA =
          a.createdAt
            ?.toMillis?.() || 0;


        const dateB =
          b.createdAt
            ?.toMillis?.() || 0;


        return dateA - dateB;

      }
    );


    if (
      allMessages.length === 0
    ) {

      messagesBox.innerHTML =
        '<div class="empty-message">Aucun message pour le moment.</div>';

      return;
    }


    messagesBox.innerHTML =
      "";


    allMessages.forEach(
      message => {

        const messageElement =
          document.createElement(
            "div"
          );


        messageElement.className =
          "message " +
          (
            message.senderId ===
            user.uid
              ? "sent"
              : ""
          );


        messageElement.textContent =
          message.text || "";


        messagesBox.appendChild(
          messageElement
        );

      }
    );


    messagesBox.scrollTop =
      messagesBox.scrollHeight;

  }


  const unsubscribeSent =
    onSnapshot(
      sentQuery,

      snapshot => {

        sentMessages =
          [];

        snapshot.forEach(
          messageDoc => {

            sentMessages.push(
              messageDoc.data()
            );

          }
        );

        displayMessages();

      },

      error => {

        console.error(
          "Messages envoyés :",
          error
        );


        messagesBox.innerHTML =
          '<div class="error">Impossible de charger les messages envoyés.</div>';

      }
    );


  const unsubscribeReceived =
    onSnapshot(
      receivedQuery,

      snapshot => {

        receivedMessages =
          [];

        snapshot.forEach(
          messageDoc => {

            receivedMessages.push(
              messageDoc.data()
            );

          }
        );

        displayMessages();

      },

      error => {

        console.error(
          "Messages reçus :",
          error
        );


        messagesBox.innerHTML =
          '<div class="error">Impossible de charger les messages reçus.</div>';

      }
    );


  unsubscribeMessages =
    () => {

      unsubscribeSent();

      unsubscribeReceived();

    };

}


/* =========================================================
   15. STATUTS
   ========================================================= */

let selectedStatusFile =
  null;


const statusPhotoInput =
  $("statusPhotoInput");


const statusVideoInput =
  $("statusVideoInput");


const statusPreview =
  $("statusPreview");


window.chooseStatusPhoto =
  function () {

    if (statusPhotoInput) {

      statusPhotoInput.value =
        "";

      statusPhotoInput.click();

    }

  };


window.chooseStatusVideo =
  function () {

    if (statusVideoInput) {

      statusVideoInput.value =
        "";

      statusVideoInput.click();

    }

  };


if (statusPhotoInput) {

  statusPhotoInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];


      if (!file) return;


      selectedStatusFile =
        file;


      showStatusPreview(
        file
      );

    }
  );

}


if (statusVideoInput) {

  statusVideoInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];


      if (!file) return;


      selectedStatusFile =
        file;


      showStatusPreview(
        file
      );

    }
  );

}


function showStatusPreview(
  file
) {

  if (!statusPreview) return;


  statusPreview.innerHTML =
    "";


  const objectURL =
    URL.createObjectURL(
      file
    );


  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    const image =
      document.createElement(
        "img"
      );


    image.src =
      objectURL;


    image.alt =
      "Aperçu de la photo";


    statusPreview.appendChild(
      image
    );


  } else if (
    file.type.startsWith(
      "video/"
    )
  ) {

    const video =
      document.createElement(
        "video"
      );


    video.src =
      objectURL;


    video.controls =
      true;


    video.playsInline =
      true;


    statusPreview.appendChild(
      video
    );


  } else {

    statusPreview.textContent =
      "Ce format de fichier n'est pas accepté.";

  }

}


/* =========================================================
   16. OUTILS DU STATUT
   ========================================================= */

let selectedStatusMusic =
  null;


let musicAudio =
  null;


window.editStatusText =
  function () {

    const box =
      $("statusTextBox");


    if (!box) return;


    box.classList.toggle(
      "hidden"
    );


    if (
      !box.classList.contains(
        "hidden"
      )
    ) {

      $("statusTextInput")
        ?.focus();

    }

  };


window.openMusicSearch =
  function () {

    const box =
      $("musicBox");


    if (!box) return;


    box.classList.toggle(
      "hidden"
    );

  };


window.searchMusic =
  async function () {

    const input =
      $("musicSearchInput");


    const results =
      $("musicResults");


    if (!results) return;


    const search =
      input?.value.trim() || "";


    if (!search) {

      results.innerHTML =
        "<p>Écris le nom d'une musique.</p>";

      return;
    }


    results.innerHTML =
      "🔎 Recherche en cours...";


    try {

      const response =
        await fetch(
          "https://itunes.apple.com/search?term=" +
          encodeURIComponent(search) +
          "&media=music&limit=10"
        );


      if (!response.ok) {

        throw new Error(
          "Recherche musicale impossible."
        );

      }


      const data =
        await response.json();


      if (
        !data.results ||
        data.results.length === 0
      ) {

        results.innerHTML =
          "<p>Aucune musique trouvée.</p>";

        return;
      }


      results.innerHTML =
        "";


      data.results.forEach(
        music => {

          if (!music.previewUrl) {
            return;
          }


          const card =
            document.createElement(
              "div"
            );


          card.className =
            "music-result";


          card.innerHTML = `

            <strong>
              ${escapeHTML(
                music.trackName
              )}
            </strong>

            <p>
              ${escapeHTML(
                music.artistName
              )}
            </p>

            <button
              type="button"
              class="music-play-button"
            >
              ▶️ Écouter
            </button>

            <button
              type="button"
              class="music-select-button"
            >
              ➕ Ajouter au statut
            </button>

          `;


          const playButton =
            card.querySelector(
              ".music-play-button"
            );


          const selectButton =
            card.querySelector(
              ".music-select-button"
            );


          if (playButton) {

            playButton.addEventListener(
              "click",
              () => {

                playMusicPreview(
                  music.previewUrl,
                  playButton
                );

              }
            );

          }


          if (selectButton) {

            selectButton.addEventListener(
              "click",
              () => {

                selectStatusMusic(
                  music
                );

              }
            );

          }


          results.appendChild(
            card
          );

        }
      );


    } catch (error) {

      console.error(
        "Erreur recherche musicale :",
        error
      );


      results.innerHTML =
        "<p>Impossible de rechercher la musique. Vérifie ta connexion Internet.</p>";

    }

  };


function playMusicPreview(
  url,
  button
) {

  if (musicAudio) {

    musicAudio.pause();

    musicAudio.currentTime =
      0;

  }


  musicAudio =
    new Audio(url);


  musicAudio.play()
    .then(() => {

      if (button) {

        button.textContent =
          "⏸️ Pause";

      }

    })
    .catch(error => {

      console.error(
        "Erreur lecture musicale :",
        error
      );


      alert(
        "Impossible de lire cette musique."
      );

    });


  musicAudio.onended =
    () => {

      if (button) {

        button.textContent =
          "▶️ Écouter";

      }

    };

}


function selectStatusMusic(
  music
) {

  selectedStatusMusic = {

    title:
      music.trackName,

    artist:
      music.artistName,

    previewUrl:
      music.previewUrl

  };


  const results =
    $("musicResults");


  if (results) {

    results.insertAdjacentHTML(
      "afterbegin",
      `

        <div class="music-selected">

          🎵 Musique sélectionnée :

          <strong>
            ${escapeHTML(
              music.trackName
            )}
          </strong>

          <p>
            ${escapeHTML(
              music.artistName
            )}
          </p>

        </div>

      `
    );

  }


  alert(
    "Musique ajoutée à ton statut !"
  );

}


/* =========================================================
   17. FILTRE
   ========================================================= */

window.applyStatusFilter =
  function () {

    const preview =
      $("statusPreview");


    if (!preview) return;


    preview.style.filter =
      preview.style.filter
        ? ""
        : "brightness(0.85) contrast(1.1)";

  };


/* =========================================================
   18. AMÉLIORATION DU TEXTE
   ========================================================= */

window.openAIEditor =
  function () {

    const box =
      $("aiBox");


    if (!box) return;


    box.classList.toggle(
      "hidden"
    );

  };


window.improveWithAI =
  function () {

    const input =
      $("statusTextInput");


    if (!input) return;


    const text =
      input.value.trim();


    input.value =
      text
        ? text.charAt(0).toUpperCase() +
          text.slice(1)
        : "Une belle journée avec LinkJo ✨";

  };


/* =========================================================
   19. ENVOI VERS CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(
  file
) {

  const url =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;


  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );


  const response =
    await fetch(
      url,
      {
        method: "POST",
        body: formData
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();


    console.error(
      "Réponse Cloudinary :",
      errorText
    );


    throw new Error(
      "Cloudinary a refusé le fichier."
    );

  }


  const data =
    await response.json();


  if (!data.secure_url) {

    throw new Error(
      "Cloudinary n'a pas retourné l'URL."
    );

  }


  return data.secure_url;

}


/* =========================================================
   20. PUBLIER UN STATUT
   ========================================================= */

window.publishStatus =
  async function () {

    const user =
      currentUser();


    if (!user) {

      alert(
        "Connecte-toi d'abord."
      );

      return;
    }


    const textInput =
      $("statusTextInput");


    const text =
      textInput?.value.trim() || "";


    if (
      !selectedStatusFile &&
      !text &&
      !selectedStatusMusic
    ) {

      alert(
        "Ajoute une photo, une vidéo, un texte ou une musique."
      );

      return;
    }


    const button =
      $("publishStatusButton");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Publication...";

    }


    try {

      let mediaUrl =
        "";

      let mediaType =
        "";


      if (selectedStatusFile) {

        mediaUrl =
          await uploadToCloudinary(
            selectedStatusFile
          );


        mediaType =
          selectedStatusFile.type.startsWith(
            "video/"
          )
            ? "video"
            : "image";

      }


      await addDoc(
        collection(
          db,
          "statuses"
        ),
        {

          userId:
            user.uid,

          userEmail:
            user.email || "",

          userName:
            user.displayName ||
            "Utilisateur",

          mediaUrl:
            mediaUrl,

          mediaType:
            mediaType,

          text:
            text,

          music:
            selectedStatusMusic,

          createdAt:
            serverTimestamp()

        }
      );


      alert(
        "Statut publié avec succès !"
      );


      resetStatusForm();


      await loadStatuses();


    } catch (error) {

      console.error(
        "Erreur publication statut :",
        error
      );


      alert(
        "Impossible de publier le statut : " +
        error.message
      );


    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Publier";

      }

    }

  };


/* =========================================================
   21. ANNULER / RÉINITIALISER LE STATUT
   ========================================================= */

function resetStatusForm() {

  selectedStatusFile =
    null;


  selectedStatusMusic =
    null;


  if (musicAudio) {

    musicAudio.pause();

    musicAudio.currentTime =
      0;

    musicAudio =
      null;

  }


  if (statusPhotoInput) {

    statusPhotoInput.value =
      "";

  }


  if (statusVideoInput) {

    statusVideoInput.value =
      "";

  }


  if (statusPreview) {

    statusPreview.innerHTML =
      "";

    statusPreview.style.filter =
      "";

  }


  const textInput =
    $("statusTextInput");


  if (textInput) {

    textInput.value =
      "";

  }


  const textBox =
    $("statusTextBox");


  if (textBox) {

    textBox.classList.add(
      "hidden"
    );

  }


  const musicBox =
    $("musicBox");


  if (musicBox) {

    musicBox.classList.add(
      "hidden"
    );

  }


  const aiBox =
    $("aiBox");


  if (aiBox) {

    aiBox.classList.add(
      "hidden"
    );

  }


  const musicResults =
    $("musicResults");


  if (musicResults) {

    musicResults.innerHTML =
      "";

  }


  const musicSearchInput =
    $("musicSearchInput");


  if (musicSearchInput) {

    musicSearchInput.value =
      "";

  }

}


window.cancelStatus =
  function () {

    const confirmation =
      confirm(
        "Veux-tu vraiment abandonner ce statut ?"
      );


    if (!confirmation) {
      return;
    }


    resetStatusForm();


    alert(
      "Création du statut abandonnée."
    );

  };


/* =========================================================
   22. AFFICHER LES STATUTS
   ========================================================= */

async function loadStatuses() {

  const list =
    $("statusesList");


  if (!list) return;


  list.innerHTML =
    '<div class="loading">Chargement des statuts...</div>';


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "statuses"
        )
      );


    const statuses =
      [];


    snapshot.forEach(
      statusDoc => {

        statuses.push({

          id:
            statusDoc.id,

          ...statusDoc.data()

        });

      }
    );


    statuses.sort(
      (a, b) => {

        const dateA =
          a.createdAt
            ?.toMillis?.() || 0;


        const dateB =
          b.createdAt
            ?.toMillis?.() || 0;


        return dateB - dateA;

      }
    );


    if (
      statuses.length === 0
    ) {

      list.innerHTML =
        '<div class="empty-message">Aucun statut pour le moment.</div>';

      return;
    }


    list.innerHTML =
      "";


    statuses.forEach(
      status => {

        const card =
          document.createElement(
            "div"
          );


        card.className =
          "status-card";


        const author =
          status.userName ||
          status.userEmail ||
          "Utilisateur";


        let media =
          "";


        if (
          status.mediaType ===
            "video" &&
          status.mediaUrl
        ) {

          media = `

            <video
              src="${escapeHTML(
                status.mediaUrl
              )}"
              controls
              playsinline
            ></video>

          `;

        } else if (
          status.mediaUrl
        ) {

          media = `

            <img
              src="${escapeHTML(
                status.mediaUrl
              )}"
              alt="Statut"
            >

          `;

        }


        let musicHTML =
          "";


        if (
          status.music &&
          status.music.previewUrl
        ) {

          musicHTML = `

            <div class="status-music">

              <p>
                🎵
                <strong>
                  ${escapeHTML(
                    status.music.title ||
                    "Musique"
                  )}
                </strong>
              </p>

              <p>
                ${escapeHTML(
                  status.music.artist ||
                  ""
                )}
              </p>

              <audio
                controls
                preload="none"
                src="${escapeHTML(
                  status.music.previewUrl
                )}"
                style="width:100%;"
              ></audio>

            </div>

          `;

        }


        card.innerHTML = `

          <strong>
            ${escapeHTML(
              author
            )}
          </strong>

          ${media}

          ${musicHTML}

          ${
            status.text
              ? `<p>${escapeHTML(
                  status.text
                )}</p>`
              : ""
          }

        `;


        list.appendChild(
          card
        );

      }
    );


  } catch (error) {

    console.error(
      "Erreur statuts :",
      error
    );


    list.innerHTML =
      '<div class="error">Impossible de charger les statuts.</div>';

  }

}


/* =========================================================
   23. ÉTAT DE CONNEXION FIREBASE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "État Firebase :",
      user
        ? "connecté"
        : "déconnecté"
    );


    if (user) {

      try {

        const userRef =
          doc(
            db,
            "users",
            user.uid
          );


        const userSnap =
          await getDoc(
            userRef
          );


        if (!userSnap.exists()) {

          await setDoc(
            userRef,
            {

              uid:
                user.uid,

              name:
                user.displayName ||
                "Utilisateur",

              username:
                "",

              email:
                user.email || "",

              photoURL:
                user.photoURL || "",

              createdAt:
                serverTimestamp()

            },
            {
              merge: true
            }
          );

        }


      } catch (error) {

        console.error(
          "Erreur création profil :",
          error
        );

      }


      showOnly(
        "homeScreen"
      );


      await loadUsers();


    } else {

      window.currentChatUser =
        null;


      if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages =
          null;

      }


      showOnly(
        "loginScreen"
      );

    }

  }
);


/* =========================================================
   24. INITIALISATION
   ========================================================= */

updateAuthMode();


console.log(
  "✅ LinkJo est correctement initialisé."
);