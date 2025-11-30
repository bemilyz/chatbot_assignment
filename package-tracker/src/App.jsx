import { useState, useEffect, useRef } from 'react'
import './App.css'

// Mock data
const packageDatabase = {
  'TST123456' : {
    status: 'In Transit',
    location: 'Los Angeles, CA',
    estimatedDelivery: 'Dec 1, 2025',
    carrier: 'FedEx',
    email: 'johndoe@gmail.com'
  },
  'TST456789': {
    status: 'Delivered',
    location: 'Your location',
    estimatedDelivery: 'Nov 25, 2025',
    deliveredDate: 'Nov 25, 2025',
    carrier: 'UPS',
    email: 'janesmith@gmail.com'
  },
  'TST789123': {
    status: 'Lost',
    lastLocation: 'San Francisco, CA',
    estimatedDelivery: 'Nov 27, 2025',
    lastSeen: 'Nov 26, 2025',
    carrier: 'USPS',
    email: 'alice@live.com'
  }
}

const emailPackageDatabase = {
  'johndoe@gmail.com': ['TST123456'],
  'janesmith@gmail.com': ['TST456789'],
  'alice@live.com': ['TST789123']
}

const validateTrackingNumber = (number) => {
    const cleanNumber = number.trim().toUpperCase();
    return /^TST\d{6}$/.test(cleanNumber);
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationState, setConversationState] = useState('greeting')
  const [userData, setUserData] = useState({
    email: '',
    trackingNumber: '',
  });
  const hasInitialized = useRef(false);
  const lastMessage = useRef(null);

  // Starting message
  useEffect(() => {
    // Prevent double render in dev mode
    if(!hasInitialized.current) {
      hasInitialized.current = true
      addBotMessage("Hi! How can I help you today? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
    } 
  }, []);

  const scrollToBottom = () => {
    lastMessage.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (text, delay = 500) => {
    setTimeout(() => {
      setMessages(prev => [...prev, {text, sender: 'bot'}]);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {text, sender: 'user'}]);
  };

  const handleSubmit = () => {
    if (input.trim()) {
      handleUserInput(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setConversationState('greeting');
    setUserData({ trackingNumber: '', email: ''});
    addBotMessage("Hi! How can I help you today? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
  };

  const handleUserInput = (userInput) => {
    const input = userInput.trim();
    addUserMessage(input);

    if (!input) {
      addBotMessage("I didn't receive an input. Could you please type your response?");
      return;
    }

    if (input.toLowerCase().includes('reset') || input.toLowerCase().includes('stop') || input.toLowerCase().includes('retry')) {
      resetChat();
      return;
    }

    switch (conversationState) {
      case 'greeting':
        handleGreetingResponse(input);
        break;
      case 'awaitingTrackingNumber':
        handleTrackingNumberInput(input);
        break;
      case 'awaitingEmail':
        handleEmailInput(input);
        break;
      case 'reportLost':
        handleLostPackageReport(input);
        break;
      case 'confirmation':
        handleConfirmation(input);
        break;
      case 'incorrectInfo':
        handleIncorrectInfo(input);
        break;
      default:
        handleUnexpectedState(input);
    }
  };

  // Unexpected user input
  const handleUnexpectedState = (input) => {
    addBotMessage("I seem to have lost track of our conversation. Let me restart. \n\nWhat would you like to do?\n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
    setConversationState('greeting');
  };

  // State immediately after the greeting, user responds one of 1, 2, or 3
  const handleGreetingResponse = (input) => { 
    if (input.includes('1')) {
      setConversationState('awaitingTrackingNumber');
      addBotMessage("Great! Please provide your tracking number.\n\n(Format: TST followed by 6 digits)");
    } else if (input.includes('2')) {
      setConversationState('reportLost');
      addBotMessage("I'm sorry to hear your package might be lost. Let me help you with that.\n\nFirst, what's your tracking number?");
    } else if (input.includes('3')) {
      addBotMessage("Connecting you to a live agent... Please hold.");
      setTimeout(() => {
        addBotMessage("Is there anything else I can help you with?\n\n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
        setConversationState('greeting');
      }, 2500);
    } else {
      addBotMessage("I didn't quite understand that. Could you please choose one of the following options?\n\n1. Track a package\n2. Report a lost package\n3. Speak with an agent.");
    }
  };

  // User inputs a tracking number
  const handleTrackingNumberInput = (input) => {
    const upper = input.trim().toUpperCase();
    
    if (!validateTrackingNumber(upper)) {
      addBotMessage("Hmm, that doesn't look like a valid tracking number.\n\nTracking numbers should be in the format TST followed by six numbers.\n\nCould you please check and re-enter your tracking number?");
      return;
    }

    setUserData(prev => ({...prev, trackingNumber: upper}));

    if (packageDatabase[upper]) {
      const pkg = packageDatabase[upper];
      
      if (pkg.status === 'Lost') {
        addBotMessage(`Your package, ${upper}, appears to be marked as lost. \n\nLast known location: ${pkg.lastLocation}\nLast seen: ${pkg.lastSeen}\nCarrier: ${pkg.carrier} \n\nWould you like to:\n1. File a claim \n2. Speak with an agent \n3. Start over`);
        setConversationState('confirmation');
      } else if (pkg.status === 'Delivered') {
        addBotMessage(`Your package (${upper}) was delivered. \n\nStatus: ${pkg.status}\nLocation: ${pkg.location}\nDelivered: ${pkg.deliveredDate}\nCarrier: ${pkg.carrier} \n\nIf you didn't receive it, please let me know and I can help you report it or you can speak to one of our agents. \n\n Respond with: \n1. File a claim \n2. Speak with an agent \n3. Start over`);
        setConversationState('confirmation');
      } else {
        addBotMessage(`Here's the current status of your package: \n\nTracking: ${upper}\nStatus: ${pkg.status}\nCurrent Location: ${pkg.location}\nEstimated Delivery: ${pkg.estimatedDelivery}\nCarrier: ${pkg.carrier} \n\nYour package is on its way!`);
        setTimeout(() => {
          addBotMessage("Is there anything else I can help you with? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
          setConversationState('greeting');
        }, 2500);
      }
    } else {
      addBotMessage(`I couldn't find a package with tracking number ${upper}. \n\nThis could mean:\n• The tracking number was entered incorrectly\n• The package hasn't been scanned yet\n• It's from a different carrier \n\nWould you like to:\n1. Try another tracking number\n2. Provide your email to search by order\n3. Speak with an agent`);
      setConversationState('incorrectInfo');
    }
  };

  // User inputs an email
  const handleEmailInput = (input) => {
    if (!validateEmail(input)) {
      addBotMessage('That does not appear to be a valid email address. \n\nPlease enter your email address in the format: example@gmail.com');
      return;
    }

    setUserData(prev => ({...prev, email: input}));

    // Invalid tracking number, try to find if there is a tracking number associated with their email
    if (!userData.trackingNumber || !packageDatabase[userData.trackingNumber]) {
      if (emailPackageDatabase[input]) {
         addBotMessage('It seems that there is an active order for this email. Could you check the tracking number and try again?');
        setTimeout(() => {
          addBotMessage("Is there anything else I can help you with? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
          setConversationState('greeting');
        }, 2500);
      } else {
        addBotMessage('I do not recognize this email. Could you check the spelling and try again?')
      }
    } else if (packageDatabase[userData.trackingNumber].email === input) {
      // Process claim if tracking number and email are verified 
      addBotMessage("Email verified successfully! \n\nNow I can proceed with filing your claim for a refund or reshipment. Your case number is #CLM-" + Math.floor(Math.random() * 10000) + ". \n\nYou'll receive updates at " + userData.email + " within 24 hours.");
      setTimeout(() => {
        addBotMessage("Is there anything else I can help you with? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
        setConversationState('greeting');
      }, 2500);
    } else {
      addBotMessage('I do not recognize this email. Could you check the spelling and try again?')
    }
  }

  // User wants to report a lost package/make a claim
  const handleLostPackageReport = (input) => {
    const upper = input.trim().toUpperCase();
    
    if (!validateTrackingNumber(upper)) {
      addBotMessage("I need a valid tracking number to help report a lost package. \n\nPlease provide your tracking number (format: TST followed by six numbers).");
      return;
    }

    setUserData(prev => ({ ...prev, trackingNumber: upper}));

    if (packageDatabase[upper]) {
      const pkg = packageDatabase[upper];
      
      if (pkg.status === 'Delivered') {
        addBotMessage(`I see that package ${upper} shows as delivered on ${pkg.deliveredDate} to ${pkg.location}. \n\nIf you didn't receive it, I can help you file a missing package claim. \n\nTo proceed, I'll need your email address:`);
        setConversationState('awaitingEmail');
      } else if (pkg.status === 'Lost') {
        addBotMessage(`This package (${upper}) is already marked as lost in our system. \n\nLast known location: ${pkg.lastLocation}\nLast seen: ${pkg.lastSeen} \n\nWould you like to file a claim or speak with an agent?\n1. File a claim\n2. Speak with an agent`);
        setConversationState('confirmation');
      } else {
        addBotMessage(`I found your package ${upper}. It's currently: \n\nStatus: ${pkg.status}\nLocation: ${pkg.location}\nEstimated Delivery: ${pkg.estimatedDelivery} \n\nSince it's still in transit, we recommend waiting for delivery. However, I can also help you with the following: \n1. File a preemptive claim\n2. Speak with an agent \n3. Start over`);
        setConversationState('confirmation');
      }
    } else {
      addBotMessage(`I couldn't find tracking number ${upper} in our system. \n\nThis might mean:\n• The number was entered incorrectly\n• It's from a different carrier\n• The package hasn't been scanned yet \n\nWould you like to:\n1. Try another tracking number\n2. Provide your email to search by order\n3. Speak with an agent`);
      setConversationState('incorrectInfo');
    }
  };

  // Tracking number was incorrect so the next options are try again, file a claim, or speak to an agent
  const handleIncorrectInfo = (input) => {
    if (input.includes('1')) {
      addBotMessage("Please provide your tracking number.\n\n(Format: TST followed by 6 digits)");
      setConversationState('awaitingTrackingNumber');
      setUserData({ trackingNumber: '', email: '', verificationCode: '', generatedCode: '' });
    } else if (input.includes('2')) {
      addBotMessage("To file a claim, I'll need to verify your email address.\n\nPlease provide your email:");
      setConversationState('awaitingEmail');
    } else if (input.includes('3')) {
      addBotMessage("Connecting you to an agent... Please hold.");
      setTimeout(() => {
        addBotMessage("Is there anything else I can help you with? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
        setConversationState('greeting');
      }, 2500);
    } else {
      addBotMessage("I didn't understand that response. Could you please choose from the available options?");
    }
  }

  // Next action is to file a claim, connect to an agent, or retry
  const handleConfirmation = (input) => {  
    if (input.includes('1')) {
      addBotMessage("To file a claim, I'll need to verify your email address.\n\nPlease provide your email:");
      setConversationState('awaitingEmail');
    } else if (input.includes('2')) {
      addBotMessage("Connecting you to an agent... Please hold.");
      setTimeout(() => {
        addBotMessage("Is there anything else I can help you with? \n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
        setConversationState('greeting');
      }, 2500);
    } else if (input.includes('3')) {
      addBotMessage("No problem! Let's start fresh.\n\nWhat would you like to do?\n1. Track a package\n2. Report a lost package\n3. Speak with an agent");
      setConversationState('greeting');
      setUserData({ trackingNumber: '', email: '', verificationCode: '', generatedCode: '' });
    } else {
      addBotMessage("I didn't understand that response. Could you please choose from the available options?");
    }
  };

  return (
    <div className='chatbot-container'>
      <div className='header'>
        <div className='header-content'>
          <h1 className="header-text">Package Tracking Helper</h1>
          <button className='reset-btn' onClick={resetChat}> <span>Reset</span> </button>
        </div>
      </div>
      <div className='messages'>
        {messages.map((message, idx) => (
          <div className={`message ${message.sender}`} key={idx} >
            <div className='message-bubble'>
              <div className='message-text'> {message.text} </div>
            </div>
          </div>
        ))}
        <div ref={lastMessage} />
      </div>
      <div className="input-container">
        <input className="input-field" type='text' value={input} onChange={(e) => setInput(e.target.value)} onKeyUp={handleKeyPress} placeholder='Type your response'/>
        <button className="send-btn" onClick={handleSubmit} disabled={!input.trim()} />
      </div>
    </div>
  );
}

export default App;
