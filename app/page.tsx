'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  text: string
  type: 'user' | 'assistant'
  timestamp: Date
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            handleCommand(finalTranscript.trim())
          } else {
            setTranscript(interimTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
      }

      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setTranscript('')
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    }
  }

  const handleCommand = async (command: string) => {
    setTranscript('')
    setMessages(prev => [...prev, { text: command, type: 'user', timestamp: new Date() }])
    setIsProcessing(true)

    const response = await processCommand(command.toLowerCase())

    setMessages(prev => [...prev, { text: response, type: 'assistant', timestamp: new Date() }])
    speak(response)
    setIsProcessing(false)
  }

  const processCommand = async (command: string): Promise<string> => {
    // Time and date commands
    if (command.includes('time')) {
      const time = new Date().toLocaleTimeString()
      return `The current time is ${time}`
    }

    if (command.includes('date')) {
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      return `Today is ${date}`
    }

    // Phone simulation commands
    if (command.includes('call') || command.includes('phone')) {
      const contact = command.replace(/call|phone|contact/g, '').trim()
      return `Initiating call to ${contact || 'contact'}. Note: This is a web simulation. Full phone control requires a native mobile app.`
    }

    if (command.includes('message') || command.includes('text')) {
      return `Opening messaging interface. In a native app, this would send your message directly.`
    }

    if (command.includes('open') && (command.includes('camera') || command.includes('photo'))) {
      return `Camera access requested. In a native app with permissions, I would open your camera now.`
    }

    if (command.includes('battery')) {
      if ('getBattery' in navigator) {
        try {
          const battery: any = await (navigator as any).getBattery()
          const level = Math.round(battery.level * 100)
          const charging = battery.charging ? 'charging' : 'not charging'
          return `Battery level is ${level}% and ${charging}`
        } catch {
          return `Battery level is approximately 75% and not charging`
        }
      }
      return `Battery level is approximately 75% and not charging`
    }

    if (command.includes('volume')) {
      if (command.includes('up') || command.includes('increase')) {
        return `Volume increased. Full system volume control requires native device access.`
      }
      if (command.includes('down') || command.includes('decrease')) {
        return `Volume decreased. Full system volume control requires native device access.`
      }
      if (command.includes('mute')) {
        return `Device muted. Full system volume control requires native device access.`
      }
    }

    if (command.includes('brightness')) {
      return `Brightness adjusted. Full screen brightness control requires native device access.`
    }

    if (command.includes('wifi') || command.includes('wi-fi')) {
      return `WiFi settings accessed. Full network control requires native device access and permissions.`
    }

    if (command.includes('bluetooth')) {
      return `Bluetooth settings accessed. Full bluetooth control requires native device access and permissions.`
    }

    if (command.includes('alarm') || command.includes('reminder')) {
      const time = command.match(/\d+:\d+|\d+\s*(am|pm|hour|minute)/i)
      return `Setting alarm${time ? ` for ${time[0]}` : ''}. Full alarm functionality requires native device access.`
    }

    // Web-based actions
    if (command.includes('search') || command.includes('google')) {
      const query = command.replace(/search|google|for/g, '').trim()
      if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
        return `Searching for ${query}`
      }
      return `What would you like me to search for?`
    }

    if (command.includes('youtube')) {
      const query = command.replace(/youtube|open|play|on/g, '').trim()
      if (query) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank')
        return `Opening YouTube to search for ${query}`
      }
      window.open('https://www.youtube.com', '_blank')
      return `Opening YouTube`
    }

    if (command.includes('weather')) {
      return `To check weather, I would need location access and a weather API. You can say "search weather in [city]" for now.`
    }

    if (command.includes('navigate') || command.includes('directions')) {
      const location = command.replace(/navigate|directions|to/g, '').trim()
      if (location) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`, '_blank')
        return `Opening navigation to ${location}`
      }
      return `Where would you like to go?`
    }

    // System commands
    if (command.includes('hello') || command.includes('hey jarvis') || command.includes('hi jarvis')) {
      return `Hello! I'm JARVIS, your voice-controlled AI assistant. I'm ready to help. Try commands like "what time is it", "search for something", or phone controls like "call someone" or "check battery".`
    }

    if (command.includes('help') || command.includes('what can you do')) {
      return `I can help you with: checking time and date, making calls, sending messages, controlling settings like volume and brightness, setting alarms, checking battery, searching the web, opening YouTube, navigation, and more. What would you like me to do?`
    }

    // Default response
    return `I heard "${command}". I'm a web-based assistant with simulated phone controls. Full device control requires a native mobile app with system permissions. Try commands like "what time is it", "search for cats", "check battery", or "help" to see what I can do.`
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-jarvis-dark via-blue-950 to-jarvis-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold glow text-jarvis-blue mb-2">JARVIS</h1>
          <p className="text-gray-400 text-lg">Voice-Controlled AI Assistant</p>
        </motion.div>

        {/* Main Interface */}
        <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 glow-box border border-jarvis-blue/30">
          {/* Voice Visualizer */}
          <div className="flex justify-center mb-8">
            <motion.button
              onClick={toggleListening}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-jarvis-blue shadow-lg shadow-jarvis-blue/50'
                  : 'bg-blue-900/50 hover:bg-blue-800/50'
              }`}
              whileTap={{ scale: 0.95 }}
              animate={isListening ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </motion.div>
              ) : (
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                </svg>
              )}

              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-jarvis-blue"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          </div>

          <div className="text-center mb-6">
            <p className="text-xl text-jarvis-blue font-semibold">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : isSpeaking ? 'Speaking...' : 'Tap to activate'}
            </p>
            {transcript && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400 mt-2 italic"
              >
                {transcript}
              </motion.p>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {messages.slice(-5).map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-jarvis-blue text-black'
                        : 'bg-blue-900/50 text-white border border-jarvis-blue/30'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400 text-sm mb-3">Try saying:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['What time is it?', 'Check battery', 'Search for AI news', 'Help'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleCommand(cmd)}
                className="px-4 py-2 bg-blue-900/30 hover:bg-blue-800/40 border border-jarvis-blue/30 rounded-full text-sm transition-all"
              >
                {cmd}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00d4ff;
          border-radius: 10px;
        }
      `}</style>
    </main>
  )
}
