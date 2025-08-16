"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";

// Define the Person type based on your Prisma schema
type Person = {
  id: string;
  slug: string;
  name: string;
  type: "PERSON" | "PROPHET" | "MESSENGER" | "MESSENGER_PROPHET";
  kunya?: string | null;
  laqab?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  gender?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  variantGroup?: string | null;
  narration?: string | null;
  isCanonical: boolean;
  biographyMd?: string | null;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
};

// Generate lineage data using Gemini API
const generateLineageData = async (selectedPerson: Person): Promise<Person[]> => {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GOOGLE_API_KEY, // Ensure API key is set in .env.local
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
                  You are a historical data generator for a database of prophets' lineages. Generate data for 20 people related to ${selectedPerson.name} (ID: ${selectedPerson.id}, Type: ${selectedPerson.type}) based on the following Prisma schema:

                 prisma
                  enum PersonType {
                    PERSON
                    PROPHET
                    MESSENGER
                    MESSENGER_PROPHET
                  }

                  enum ModerationStatus {
                    PENDING_REVIEW
                    APPROVED
                    REJECTED
                  }

                  model Person {
                    id        String   @id @default(cuid())
                    slug      String   @unique
                    name      String
                    type      PersonType @default(PERSON)
                    kunya     String?
                    laqab     String?
                    birthYear Int?
                    deathYear Int?
                    gender    String?
                    fatherId  String?
                    motherId  String?
                    variantGroup String?
                    narration    String?
                    isCanonical  Boolean   @default(true)
                    biographyMd String?
                    status      ModerationStatus @default(PENDING_REVIEW)
                  }
                  

                  Requirements:
                  - Generate 20 people, including ancestors, descendants, and contemporaries (e.g., parents, children, spouses, or other relatives).
                  - Include 1-2 variant records for ${selectedPerson.name} with different narrations (e.g., "Ibn Hisham", "Ibn Ishaq") under the same variantGroup ("${selectedPerson.slug}").
                  - Assign unique IDs (use a prefix like "gen-" followed by a number or UUID-like string).
                  - Create unique slugs based on names (e.g., "${selectedPerson.slug}-father", "${selectedPerson.slug}-variant-ibnhisham").
                  - Set appropriate PersonType: "PROPHET", "MESSENGER", or "MESSENGER_PROPHET" for prophets/messengers, "PERSON" for others.
                  - Include optional fields (kunya, laqab, birthYear, deathYear, gender) where relevant, based on historical context.
                  - Use fatherId and motherId to link family members (ensure IDs match generated records or leave null if unknown).
                  - Set isCanonical to true for primary records, false for variants.
                  - Set status to "APPROVED" for canonical records, "PENDING_REVIEW" for variants.
                  - Include a short biographyMd in Markdown format for each person.
                  - Ensure relationships are consistent (e.g., a child's fatherId matches a generated parent's ID).
                  - Output the result as a JSON array of objects, strictly adhering to the Person schema.
                `,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    // Extract the generated content from Gemini's response
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || "[]";
    // Parse the JSON string (Gemini may wrap it in markdown code blocks)
    const cleanedText = generatedText.replace(/```json\n|\n```/g, "").trim();
    const generatedData: Person[] = JSON.parse(cleanedText);

    // Validate and ensure exactly 20 records
    if (!Array.isArray(generatedData) || generatedData.length !== 20) {
      throw new Error("Invalid or insufficient data generated by Gemini API");
    }

    // Ensure schema compliance (basic validation)
    generatedData.forEach((person) => {
      if (!person.id || !person.slug || !person.name || !person.type || !person.status) {
        throw new Error("Generated person data missing required fields");
      }
      if (!["PERSON", "PROPHET", "MESSENGER", "MESSENGER_PROPHET"].includes(person.type)) {
        throw new Error(`Invalid PersonType: ${person.type}`);
      }
      if (!["PENDING_REVIEW", "APPROVED", "REJECTED"].includes(person.status)) {
        throw new Error(`Invalid ModerationStatus: ${person.status}`);
      }
    });

    return generatedData.slice(0, 20);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate lineage data with Gemini API");
  }
};

export default function LineageGeneratorPage() {
  const [open, setOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [generatedPeople, setGeneratedPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch people for the combobox
  useEffect(() => {
    async function fetchPeople() {
      try {
        const response = await fetch("/api/people");
        if (!response.ok) throw new Error("Failed to fetch people");
        const data = await response.json();
        setPeople(data);
      } catch (error) {
     
      }
    }
    fetchPeople();
  }, []);

  // Handle generate button click
  const handleGenerate = async () => {
    if (!selectedPerson) {
     
      return;
    }

    setLoading(true);
    try {
      const generated = await generateLineageData(selectedPerson);
      setGeneratedPeople(generated);

      // Save to database
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generated),
      });

      if (!response.ok) throw new Error("Failed to save generated data");

    } catch (error) {
     
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lineage Generator</h1>
      <div className="flex gap-4 mb-4">
        {/* Combobox for selecting a person */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {selectedPerson ? selectedPerson.name : "Select person..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search person..." className="h-9" />
              <CommandList>
                <CommandEmpty>No person found.</CommandEmpty>
                <CommandGroup>
                  {people.map((person) => (
                    <CommandItem
                      key={person.id}
                      value={person.id}
                      onSelect={() => {
                        setSelectedPerson(person);
                        setOpen(false);
                      }}
                    >
                      {person.name} ({person.type})
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedPerson?.id === person.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={loading || !selectedPerson}>
          {loading ? "Generating..." : "Generate Lineage"}
        </Button>
      </div>

      {/* Display Generated Results */}
      {generatedPeople.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Generated Lineage</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border">
              <thead>
                <tr>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Gender</th>
                  <th className="border p-2">Father</th>
                  <th className="border p-2">Mother</th>
                  <th className="border p-2">Narration</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {generatedPeople.map((person) => (
                  <tr key={person.id}>
                    <td className="border p-2">{person.name}</td>
                    <td className="border p-2">{person.type}</td>
                    <td className="border p-2">{person.gender || "N/A"}</td>
                    <td className="border p-2">
                      {person.fatherId
                        ? people.find((p) => p.id === person.fatherId)?.name ||
                          generatedPeople.find((p) => p.id === person.fatherId)?.name ||
                          "Unknown"
                        : "N/A"}
                    </td>
                    <td className="border p-2">
                      {person.motherId
                        ? people.find((p) => p.id === person.motherId)?.name ||
                          generatedPeople.find((p) => p.id === person.motherId)?.name ||
                          "Unknown"
                        : "N/A"}
                    </td>
                    <td className="border p-2">{person.narration || "N/A"}</td>
                    <td className="border p-2">{person.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}