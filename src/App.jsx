import { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import Loader from "./components/Loader";
import Login from "./components/Login";
import { VscRobot } from "react-icons/vsc";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const timer = setTimeout(() => setLoading(false), 1200);
      return () => clearTimeout(timer);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      const chatsRef = collection(db, "users", user.uid, "chats");
      const q = query(chatsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const newChat = await addDoc(chatsRef, {
          title: "New Chat",
          createdAt: Date.now(),
        });
        setChats([{ id: newChat.id, title: "New Chat" }]);
        setActiveChat(newChat.id);
      } else {
        const loaded = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(loaded);
        setActiveChat(loaded[0].id);
      }
    };
    loadChats();
  }, [user]);

  const handleLogoutSession = async () => {
    try {
      await signOut(auth);
      setChats([]);
      setActiveChat(null);
    } catch (err) {
      console.error("Error signing out user workspace: ", err.message);
    }
  };

  const createNewChat = async () => {
    const chatsRef = collection(db, "users", user.uid, "chats");
    const docRef = await addDoc(chatsRef, {
      title: "New Chat",
      createdAt: Date.now(),
    });
    const newChat = { id: docRef.id, title: "New Chat" };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
    setSidebarOpen(false);
  };

  const updateChatTitle = async (chatId, firstQuestion) => {
    const title =
      firstQuestion.length > 20
        ? firstQuestion.substring(0, 20) + "..."
        : firstQuestion;

    const chatRef = doc(db, "users", user.uid, "chats", chatId);
    await updateDoc(chatRef, { title });

    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat))
    );
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();

    const chatRef = doc(db, "users", user.uid, "chats", chatId);
    await deleteDoc(chatRef);

    const updatedChats = chats.filter((chat) => chat.id !== chatId);

    if (activeChat === chatId) {
      if (updatedChats.length > 0) {
        setActiveChat(updatedChats[0].id);
      } else {
        const chatsRef = collection(db, "users", user.uid, "chats");
        const docRef = await addDoc(chatsRef, {
          title: "New Chat",
          createdAt: Date.now(),
        });
        const fallback = { id: docRef.id, title: "New Chat" };
        updatedChats.push(fallback);
        setActiveChat(fallback.id);
      }
    }
    setChats(updatedChats);
  };

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  if (loading) return <Loader />;
  if (!user) return <Login onLoginSuccess={() => {}} />;

  return (
    <div className="h-screen flex bg-[#070a0e] text-slate-100 font-sans overflow-hidden antialiased">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30 transition-all duration-300"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <div
        className={`
          fixed md:static z-40 top-0 left-0 h-full w-72
          bg-[#090d14] border-r border-white/5 p-5 flex flex-col
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex items-center gap-3 mb-6 px-1 select-none">
          <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 text-cyan-400 flex items-center justify-center shadow-inner">
            <VscRobot className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white/90">
              Edith - AI Assistant
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Your Personal AI Companion
            </span>
          </div>
        </div>

        <button
          onClick={createNewChat}
          className="w-full bg-white text-slate-950 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          + New Chat
        </button>

        <div className="my-5 border-t border-white/5"></div>

        {/* CHAT LIST */}
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {chats.map((chat) => {
            const isActive = activeChat === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat.id);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-white/5 text-white border border-white/5"
                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                      isActive
                        ? "bg-slate-100 ring-4 ring-slate-100/20"
                        : "bg-slate-600 group-hover:bg-slate-400"
                    }`}
                  />
                  <span className="truncate font-medium">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-md text-slate-100 hover:text-red-400 hover:bg-white/5 transition-all duration-150 text-base leading-none cursor-pointer"
                  title="Delete Chat"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>

        {/* MOBILE ONLY USER FOOTER WITH AVATAR */}
        <div className="mt-auto pt-4 border-t border-white/5 md:hidden">
          <div className="flex items-center gap-3 mb-3 px-1 text-xs">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover block visual-avatar"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                {getUserInitial()}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1 pr-2">
              <span className="text-white/80 font-medium truncate">
                {user.displayName || "Active Student"}
              </span>
              <span className="text-slate-500 text-[10px] truncate">
                {user.email}
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 animate-pulse shrink-0" />
          </div>
          <button
            onClick={handleLogoutSession}
            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all duration-200 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE VIEW FRAME */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b0f17]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#090d14]/30 backdrop-blur-md h-18.25">

          {/* MOBILE NAVIGATION HEADER */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition text-slate-300 cursor-pointer"
            >
              ☰
            </button>
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-wide text-slate-300">
              <VscRobot className="w-6 h-6 shrink-0 text-cyan-400" />
              <span className="truncate">Edith - AI Assistant</span>
            </h1>
          </div>

          {/* DESKTOP CENTERED HEADER TITLE */}
          <h1 className="hidden md:block mx-auto text-sm font-semibold tracking-wide text-slate-300 uppercase pl-40">
            Your Workspace
          </h1>

          {/* DESKTOP PROFILE CARD WITH USER AVATAR */}
          <div className="hidden md:flex items-center gap-3 bg-white/2 border border-white/5 pl-4 pr-2 py-1.5 rounded-xl select-none max-w-xs shrink-0">
            <div className="flex flex-col text-right min-w-0">
              <span className="text-white/90 text-xs font-semibold truncate leading-tight">
                {user.displayName || "Active User"}
              </span>
              <span className="text-slate-500 text-[10px] truncate leading-none mt-0.5">
                {user.email}
              </span>
            </div>

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-white/10 object-cover shrink-0 block visual-avatar"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                {getUserInitial()}
              </div>
            )}

            <div className="h-6 w-px bg-white/10 shrink-0"></div>

            <button
              onClick={handleLogoutSession}
              className="text-[11px] font-medium text-rose-500 hover:text-slate-100 bg-white hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
            >
              Sign Out
            </button>
          </div>

        </div>

        {/* CHAT CONTAINER BOX CONTAINER */}
        <div className="flex justify-center flex-1 overflow-hidden">
          <div className="w-full max-w-4xl flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ChatBox
                activeChatId={activeChat}
                onFirstMessage={(txt) => updateChatTitle(activeChat, txt)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}