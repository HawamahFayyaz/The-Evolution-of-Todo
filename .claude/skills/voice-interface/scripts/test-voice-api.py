#!/usr/bin/env python3
"""Test if browser supports Web Speech API"""
import sys

# This script generates HTML to test voice API
test_html = """
<!DOCTYPE html>
<html>
<head>
    <title>Voice API Test</title>
</head>
<body>
    <h1>Voice API Support Test</h1>
    <div id="results"></div>

    <script>
        const results = document.getElementById('results');

        // Check SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            results.innerHTML += '<p>✅ Speech Recognition supported</p>';
        } else {
            results.innerHTML += '<p>❌ Speech Recognition NOT supported</p>';
        }

        // Check SpeechSynthesis
        if ('speechSynthesis' in window) {
            results.innerHTML += '<p>✅ Speech Synthesis supported</p>';
        } else {
            results.innerHTML += '<p>❌ Speech Synthesis NOT supported</p>';
        }

        // Test recognition
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            results.innerHTML += '<p>ℹ️  Click "Start" to test voice recognition</p>';

            const btn = document.createElement('button');
            btn.textContent = 'Start Recognition';
            btn.onclick = () => {
                recognition.start();
                results.innerHTML += '<p>🎤 Listening... Say something!</p>';
            };
            results.appendChild(btn);

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                results.innerHTML += `<p>✅ Recognized: "${transcript}"</p>`;
            };

            recognition.onerror = (event) => {
                results.innerHTML += `<p>❌ Error: ${event.error}</p>`;
            };
        }
    </script>
</body>
</html>
"""

print("Generating voice API test file...")
with open("voice-test.html", "w") as f:
    f.write(test_html)

print("✅ Created voice-test.html")
print("Open this file in your browser to test voice API support")
sys.exit(0)
