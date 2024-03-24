import {
  FormEvent,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import './App.scss';
import { io } from 'socket.io-client';

interface Message {
  room: string;
  message: string;
  username: string;
  time: Date;
}

const App: FunctionComponent = () => {
  const messageRef = useRef<HTMLDivElement | null>(null);
  const socket = io(`${process.env.API_URL}`);

  const [roomID, setRoomID] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [joined, setJoined] = useState<boolean>(false);

  const scroll_to_bottom = () => {
    if (messageRef?.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  };

  const format_date = (date: Date): string => {
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = daysOfWeek[date.getDay()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${dayOfWeek}, ${formattedHours}:${formattedMinutes}${ampm}`;
  };

  const join_room = (e: FormEvent) => {
    e.preventDefault();
    if (roomID && username) {
      socket.emit('join_room', { room: roomID });
      setJoined(true);
    } else {
      alert('Invalid Username/Room ID!!');
    }
  };

  const send_message = (e: FormEvent) => {
    e.preventDefault();
    if (message) {
      const send_msg: Message = {
        username,
        message,
        time: new Date(),
        room: roomID,
      };

      socket.emit('send_message', { ...send_msg });
      setMessages(prev => [...prev, { ...send_msg }]);
      setMessage('');
      scroll_to_bottom();
    } else {
      alert('Message field is missing!!');
    }
  };

  const change_account = () => {
    socket.emit('leave_room', { room: roomID });
    socket.off('receive_message');
    setJoined(false);
    setRoomID('');
    setUsername('');
    socket.disconnect();
  };

  useEffect(() => {
    setMessages([]);
    setMessage('');
    setJoined(false);
  }, [roomID, username]);

  useEffect(() => {
    socket.on('receive_message', (data: Message) => {
      if (data?.message && data?.username !== username) {
        setMessages(prev => [...prev, { ...data }]);
        scroll_to_bottom();
      }
    });
  }, [socket]);

  return (
    <>
      <main className="app_main">
        <div className="messages-container">
          <h1>
            Room:{' '}
            <i
              style={{
                fontWeight: 400,
                fontSize: '19px',
                marginBottom: '3px',
              }}>
              {roomID || 'No Room'}
            </i>
          </h1>

          <section className="messages" ref={messageRef}>
            {messages?.map(itm_msg => (
              <div
                className={
                  itm_msg.username === username
                    ? 'msg msg-right'
                    : 'msg msg-left'
                }
                key={itm_msg?.time?.toString()}>
                {itm_msg?.username !== username && (
                  <p className="msg-username">{itm_msg?.username}</p>
                )}
                <p className="msg-message">{itm_msg.message}</p>
                <p className="msg-time">
                  {format_date(new Date(itm_msg.time))}
                </p>
              </div>
            ))}
          </section>
        </div>

        <div className="form-container">
          <h1>Wanna Chat?</h1>

          {!joined && (
            <form className="form" onSubmit={join_room}>
              <input
                className="input"
                type="text"
                value={roomID}
                onChange={e => setRoomID(e.target.value)}
                placeholder="Enter a Room ID..."
                max={10}
              />
              <input
                className="input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your Username..."
                max={10}
              />
              <button className="btn" type="submit">
                Join Room
              </button>
            </form>
          )}

          {joined && (
            <form className="form" onSubmit={send_message}>
              <input
                className="input"
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter a message..."
              />

              <button className="btn" type="submit">
                Send Message
              </button>
              <button
                onClick={change_account}
                style={{
                  marginTop: 'auto',
                }}
                className="btn"
                type="button">
                Change Account
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
};

export default App;
