---
name: voice-interface
description: Add voice command interface using Web Speech API for hands-free task management
---

# Voice Interface Skill

## Purpose
Enable voice-controlled task management using Web Speech API for accessibility and hands-free operation (+200 bonus points).

## Core Principles
1. **Browser Native**: Use Web Speech API (no external services)
2. **Accessibility**: Support users with disabilities
3. **Natural Language**: Understand conversational commands
4. **Visual Feedback**: Show listening status clearly
5. **Fallback**: Works alongside keyboard/mouse

## When to Use
- Phase III+: AI chatbot with voice commands
- Accessibility requirements
- Hands-free operation (driving, cooking, etc.)
- Bonus points (+200)

## Browser Support Check
```typescript
// lib/voice.ts
export function isVoiceSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    ('speechSynthesis' in window)
  );
}
```

## Voice Recognition Component
```tsx
// components/VoiceInput.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onCommand: (command: string) => void;
  language?: string;
}

export function VoiceInput({ onCommand, language = 'en-US' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;  // Stop after one result
    recognition.interimResults = true;  // Show interim results
    recognition.lang = language;

    // Event handlers
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;

      setTranscript(transcript);

      // Final result
      if (event.results[current].isFinal) {
        onCommand(transcript);
        setTranscript('');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onCommand]);

  function toggleListening() {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {transcript && (
        <div className="text-sm text-gray-700 italic">
          "{transcript}"
        </div>
      )}

      {isListening && (
        <div className="text-sm text-gray-500">
          Listening...
        </div>
      )}
    </div>
  );
}
```

## Voice Output (Text-to-Speech)
```typescript
// lib/speech.ts
export function speak(text: string, lang: string = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;  // Speed
  utterance.pitch = 1.0;  // Pitch
  utterance.volume = 1.0;  // Volume

  window.speechSynthesis.speak(utterance);
}
```

## Voice Command Parser
```typescript
// lib/voice-commands.ts
export interface VoiceCommand {
  type: 'add' | 'list' | 'complete' | 'delete' | 'update';
  params: Record<string, any>;
}

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const lower = transcript.toLowerCase().trim();

  // Add task
  const addPatterns = [
    /^add (.+)$/,
    /^create (.+)$/,
    /^new task (.+)$/,
    /^remember to (.+)$/,
    /^i need to (.+)$/
  ];

  for (const pattern of addPatterns) {
    const match = lower.match(pattern);
    if (match) {
      return {
        type: 'add',
        params: { title: match[1] }
      };
    }
  }

  // List tasks
  const listPatterns = [
    /^(show|list|what are|what's) (my )?tasks?$/,
    /^what do i need to do$/,
    /^what's on my list$/
  ];

  for (const pattern of listPatterns) {
    if (pattern.test(lower)) {
      return {
        type: 'list',
        params: {}
      };
    }
  }

  // Complete task
  const completePatterns = [
    /^(mark|complete|finish|done) (task )?(\d+)$/,
    /^task (\d+) (is )?(done|complete|finished)$/
  ];

  for (const pattern of completePatterns) {
    const match = lower.match(pattern);
    if (match) {
      const taskId = parseInt(match[match.length - 1]);
      return {
        type: 'complete',
        params: { taskId }
      };
    }
  }

  // Delete task
  const deletePatterns = [
    /^delete (task )?(\d+)$/,
    /^remove (task )?(\d+)$/,
    /^get rid of (task )?(\d+)$/
  ];

  for (const pattern of deletePatterns) {
    const match = lower.match(pattern);
    if (match) {
      const taskId = parseInt(match[match.length - 1]);
      return {
        type: 'delete',
        params: { taskId }
      };
    }
  }

  return null;  // Unrecognized command
}
```

## Complete Voice-Enabled Chat Page
```tsx
// app/chat/page.tsx
"use client";

import { useState } from 'react';
import { VoiceInput } from '@/components/VoiceInput';
import { parseVoiceCommand } from '@/lib/voice-commands';
import { speak } from '@/lib/speech';
import { api } from '@/lib/api';

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [processing, setProcessing] = useState(false);

  async function handleVoiceCommand(transcript: string) {
    setProcessing(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: transcript }]);

    // Parse command
    const command = parseVoiceCommand(transcript);

    if (!command) {
      const response = "I didn't understand that. Try saying 'add task' or 'show my tasks'.";
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak(response);
      setProcessing(false);
      return;
    }

    try {
      let response = '';

      switch (command.type) {
        case 'add':
          const newTask = await api.createTask({ title: command.params.title });
          response = `Added task: ${newTask.title}`;
          break;

        case 'list':
          const tasks = await api.getTasks();
          if (tasks.length === 0) {
            response = "You have no tasks.";
          } else {
            response = `You have ${tasks.length} tasks. ${tasks.map((t: any) => t.title).join(', ')}`;
          }
          break;

        case 'complete':
          await api.updateTask(command.params.taskId, { completed: true });
          response = `Marked task ${command.params.taskId} as complete.`;
          break;

        case 'delete':
          await api.deleteTask(command.params.taskId);
          response = `Deleted task ${command.params.taskId}.`;
          break;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak(response);

    } catch (error) {
      const response = "Sorry, something went wrong.";
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak(response);
    }

    setProcessing(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Voice Todo</h1>

      <div className="mb-8 h-96 overflow-y-auto border rounded p-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 p-3 rounded ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-12'
                : 'bg-white mr-12'
            }`}
          >
            <div className="font-semibold mb-1">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div>{msg.content}</div>
          </div>
        ))}

        {processing && (
          <div className="text-center text-gray-500">Processing...</div>
        )}
      </div>

      <div className="flex justify-center">
        <VoiceInput onCommand={handleVoiceCommand} />
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p className="font-semibold mb-2">Try saying:</p>
        <ul className="space-y-1">
          <li>"Add buy groceries"</li>
          <li>"Show my tasks"</li>
          <li>"Complete task 1"</li>
          <li>"Delete task 2"</li>
        </ul>
      </div>
    </div>
  );
}
```

## Wake Word Detection (Optional)
```typescript
// lib/wake-word.ts
export class WakeWordDetector {
  private recognition: any;
  private isActive: boolean = false;
  private wakeWord: string;

  constructor(wakeWord: string = 'hey todo') {
    this.wakeWord = wakeWord.toLowerCase();

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;  // Keep listening
    this.recognition.interimResults = false;
  }

  start(onWakeWord: () => void) {
    this.isActive = true;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();

      if (transcript.includes(this.wakeWord)) {
        onWakeWord();
      }
    };

    this.recognition.start();
  }

  stop() {
    this.isActive = false;
    this.recognition.stop();
  }
}

// Usage
const detector = new WakeWordDetector('hey todo');
detector.start(() => {
  console.log('Wake word detected!');
  // Start main voice recognition
});
```

## Common Mistakes ❌

| Mistake | Fix |
|---------|-----|
| ❌ No browser support check | ✅ Check for SpeechRecognition availability |
| ❌ Continuous listening drains battery | ✅ Use single-command mode |
| ❌ No visual feedback | ✅ Show listening animation |
| ❌ Poor command recognition | ✅ Use multiple patterns per command |
| ❌ No mic permissions handling | ✅ Handle permission errors gracefully |

## Usage Instructions

### Add Voice Input
@.claude/skills/voice-interface/Skill.md
Add voice command support to todo chatbot.
Features:

Voice input component with mic button
Speech recognition using Web Speech API
Command parser (add, list, complete, delete)
Text-to-speech responses
Visual feedback (listening animation)

Save to: frontend/components/VoiceInput.tsx
