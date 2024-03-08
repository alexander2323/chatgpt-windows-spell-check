const axios = require("axios");

const api_key = "";

async function chatGPT(prompt) {
	const Messages = [{ role: "user", content: prompt }];

	const response = await axios.post(
		"https://api.openai.com/v1/chat/completions",
		{
			model: "gpt-4-1106-preview",
			messages: Messages,
		},
		{
			headers: {
				Authorization: `Bearer ${api_key}`,
				"Content-Type": "application/json",
			},
		}
	);

	// Error checking
	if (!response.data.choices) {
		return "No choices in the response.";
	} else if (!response.data.choices[0]) {
		return "No first choice in the response.";
	} else if (!response.data.choices[0].message) {
		return "No message in the first choice.";
	} else {
		// Return the AI's response, which should be a summary of the provided text
		return response.data.choices[0].message.content;
	}
}

module.exports = chatGPT;
