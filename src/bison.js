import { DiscussServiceClient } from "@google-ai/generativelanguage";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();

const MODEL_NAME = "models/chat-bison-001";

if (!process.env.API_KEY) {
  throw new Error("Google Generative AI API_KEY variable not set in the env.");
}

const API_KEY = process.env.API_KEY;

const client = new DiscussServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

async function runPredict(inputMessage) {
  const context =
    "You are a helpful assistant. Your name is Bison. You will respond to the user in a concise manner adhering to context provided by the user.";
  const examples = [
    {
      input: {
        content: "You are a helpful assistant.",
      },
      output: {
        content:
          "Thank you! I am glad you find me helpful. I am always learning new things, and I hope to be able to help you with even more tasks in the future.",
      },
    },
  ];
  const messages = [
    {
      content: inputMessage,
    },
  ];

  try {
    const result = await client.generateMessage({
      model: MODEL_NAME,
      temperature: 0.25,
      candidateCount: 1,
      top_k: 40,
      top_p: 0.95,
      prompt: {
        context: context,
        examples: examples,
        messages: messages,
      },
    });

    const generatedContent = result[0].candidates[0].content;
    let modifiedContent;
    const citationSources =
      result[0]?.candidates[0]?.citationMetadata?.citationSources ?? [];

    if (citationSources.length > 0) {
      const citations =
        result[0].candidates[0].citationMetadata.citationSources;

      modifiedContent = await getCitations(citations);
    } else {
      modifiedContent = [];
    }

    return { generatedContent, modifiedContent };
  } catch (error) {
    throw error;
  }
}

async function getCitations(citations) {
  const citationArray = [];

  citations.forEach((citation, index) => {
    const position = citation.startIndex;
    const url = citation.uri;
    const citationInfo = `[${index + 1}]${url}`;
    citationArray.push(citationInfo);
  });

  const citationResponse =
    "<i>Citations:\n" + citationArray.join("\n") + "</i>";
  return citationResponse;
}

export { runPredict };
