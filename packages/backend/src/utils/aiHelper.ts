import { GoogleGenAI } from "@google/genai";
import { SearchQuery } from "../types";

export const parseSearchQuery = async (
  searchText: string,
): Promise<SearchQuery> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "your-gemini-api-key") {
    try {
      return parseWithGemini(searchText, apiKey);
    } catch (error) {
      console.error("Gemini AI search failed, falling back to mock:", error);
    }
  }

  return mockAIParser(searchText);
};

const SYSTEM_PROMPT = `You are a search filter extractor for an animal adoption platform.
Your job is to infer what animal the user WANTS TO ADOPT based on their message.

Rules:
- If the user expresses dislike/avoidance of an animal type, EXCLUDE that type and infer they want the others
- "I don't like cats" → they want dogs (or other)
- "not a cat person" → type: "dog"
- "allergic to cats" → type: "dog"
- Recognize synonyms: "pup/puppy/doggo" → dog, "kitten/kitty" → cat
- Location synonyms: "TLV/tel aviv/telaviv" → "Tel Aviv", "NYC/new york/ny" → "New York"
- Size hints: "apartment" or "small space" → size: "small", "house with yard" → any size
- "friendly" / "good with kids" / "gentle" / "family" → goodWithKids: true
- "good with other animals" / "gets along with pets" → goodWithOtherAnimals: true
- "vaccinated" / "shots" → vaccinated: true
- "neutered" / "spayed" / "fixed" → neutered: true
- Age hints: "young" / "puppy/kitten age" → ageMax: 2, "senior" / "old" → ageMin: 7, "adult" → ageMin: 2, ageMax: 7
- "available" / "ready for adoption" → adoptionStatus: "available"
- Only include fields you're confident about. Omit uncertain fields entirely.
- Return ONLY valid JSON, no markdown, no explanation.
Fields:
- type: "dog" | "cat" | "other"
- location: string (normalized city name)
- size: "small" | "medium" | "large"
- gender: "male" | "female"
- vaccinated: boolean
- neutered: boolean
- goodWithKids: boolean
- goodWithOtherAnimals: boolean
- adoptionStatus: "available" | "pending" | "adopted"
- ageMin: number
- ageMax: number

Examples:
"I don't like cats" → {"type":"dog"}
"Looking for a friendly dog in TLV" → {"type":"dog","goodWithKids":true,"location":"Tel Aviv"}
"Want a small pet for my apartment in NYC" → {"size":"small","location":"New York"}
"Female kitten please" → {"type":"cat","gender":"female"}
"Something not too big, I have kids" → {"size":"small","goodWithKids":true}
"vaccinated neutered male cat" → {"type":"cat","gender":"male","vaccinated":true,"neutered":true}
"young dog under 3 years" → {"type":"dog","ageMax":3}
"senior dog good with other pets" → {"ageMin":7,"goodWithOtherAnimals":true}`;

export const parseWithGemini = async (
  query: string,
  apiKey: string,
): Promise<SearchQuery> => {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-preview";
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: `Extract search filters from: "${query}"`,
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  const text = (response.text ?? "").trim();
  console.log("Gemini response:", JSON.stringify(response));

  const jsonText = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  return toSearchQuery(JSON.parse(jsonText));
};

const VALID_TYPES = ["dog", "cat", "other"] as const;
const VALID_GENDERS = ["male", "female"] as const;
const VALID_SIZES = ["small", "medium", "large"] as const;
const VALID_STATUSES = ["available", "pending", "adopted"] as const;

function toSearchQuery(raw: Record<string, unknown>): SearchQuery {
  const q: SearchQuery = {};

  if (VALID_TYPES.includes(raw.type as (typeof VALID_TYPES)[number])) {
    q.type = raw.type as SearchQuery["type"];
  }
  if (VALID_GENDERS.includes(raw.gender as (typeof VALID_GENDERS)[number])) {
    q.gender = raw.gender as SearchQuery["gender"];
  }
  if (VALID_SIZES.includes(raw.size as (typeof VALID_SIZES)[number])) {
    q.size = raw.size as SearchQuery["size"];
  }
  if (
    VALID_STATUSES.includes(
      raw.adoptionStatus as (typeof VALID_STATUSES)[number],
    )
  ) {
    q.adoptionStatus = raw.adoptionStatus as SearchQuery["adoptionStatus"];
  }
  if (raw.location && typeof raw.location === "string")
    q.location = raw.location;
  if (typeof raw.vaccinated === "boolean") q.vaccinated = raw.vaccinated;
  if (typeof raw.neutered === "boolean") q.neutered = raw.neutered;
  if (typeof raw.goodWithKids === "boolean") q.goodWithKids = raw.goodWithKids;
  if (typeof raw.goodWithOtherAnimals === "boolean")
    q.goodWithOtherAnimals = raw.goodWithOtherAnimals;
  if (typeof raw.ageMin === "number") q.ageMin = raw.ageMin;
  if (typeof raw.ageMax === "number") q.ageMax = raw.ageMax;

  return q;
}

export const mockAIParser = (query: string): SearchQuery => {
  const lowerQuery = query.toLowerCase();
  const filters: SearchQuery = {};

  if (lowerQuery.includes("dog") || lowerQuery.includes("puppy")) {
    filters.type = "dog";
  } else if (lowerQuery.includes("cat") || lowerQuery.includes("kitten")) {
    filters.type = "cat";
  }

  if (lowerQuery.includes("female")) {
    filters.gender = "female";
  } else if (lowerQuery.includes("male")) {
    filters.gender = "male";
  }

  if (lowerQuery.includes("small") || lowerQuery.includes("tiny")) {
    filters.size = "small";
  } else if (lowerQuery.includes("large") || lowerQuery.includes("big")) {
    filters.size = "large";
  } else if (lowerQuery.includes("medium")) {
    filters.size = "medium";
  }

  if (lowerQuery.includes("vaccinated") || lowerQuery.includes("shots")) {
    filters.vaccinated = true;
  }
  if (
    lowerQuery.includes("neutered") ||
    lowerQuery.includes("spayed") ||
    lowerQuery.includes("fixed")
  ) {
    filters.neutered = true;
  }

  if (
    lowerQuery.includes("friendly") ||
    lowerQuery.includes("gentle") ||
    lowerQuery.includes("calm") ||
    lowerQuery.includes("kids") ||
    lowerQuery.includes("children") ||
    lowerQuery.includes("family")
  ) {
    filters.goodWithKids = true;
  }
  if (
    lowerQuery.includes("other animals") ||
    lowerQuery.includes("other pets") ||
    lowerQuery.includes("gets along")
  ) {
    filters.goodWithOtherAnimals = true;
  }

  if (
    lowerQuery.includes("young") ||
    lowerQuery.includes("puppy") ||
    lowerQuery.includes("kitten")
  ) {
    filters.ageMax = 2;
  } else if (lowerQuery.includes("senior") || lowerQuery.includes("old")) {
    filters.ageMin = 7;
  }

  if (lowerQuery.includes("available")) {
    filters.adoptionStatus = "available";
  } else if (lowerQuery.includes("adopted")) {
    filters.adoptionStatus = "adopted";
  } else if (lowerQuery.includes("pending")) {
    filters.adoptionStatus = "pending";
  }

  const locationMatch = query.match(
    /\b(?:in|near|from|around|at)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
  );
  if (locationMatch) {
    filters.location = locationMatch[1]
      .replace(/\b(for|the|a|an|and|or|with)\s*$/i, "")
      .trim();
  }

  return filters;
};
