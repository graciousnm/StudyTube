import { describe, expect, it } from "vitest";
import {
  courseOutlineSchema,
  curateVideosInputSchema,
  curatedVideosSchema,
  generateModuleInputSchema,
  generateOutlineInputSchema,
  moduleOutlineSchema,
  searchQueriesSchema,
  suggestMissingModuleInputSchema,
  topicsWithResultsSchema,
} from "./ai.validation";

describe("generateOutlineInputSchema", () => {
  it("accepts a valid input", () => {
    const result = generateOutlineInputSchema.safeParse({
      goal: "Learn worship piano",
      experience: "Beginner",
      detail: "standard",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input without experience", () => {
    const result = generateOutlineInputSchema.safeParse({
      goal: "Learn worship piano",
      detail: "short",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing goal", () => {
    expect(
      generateOutlineInputSchema.safeParse({ detail: "standard" }).success,
    ).toBe(false);
  });

  it("rejects an empty goal", () => {
    expect(
      generateOutlineInputSchema.safeParse({ goal: "  ", detail: "standard" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid detail level", () => {
    expect(
      generateOutlineInputSchema.safeParse({
        goal: "Learn something",
        detail: "extra",
      }).success,
    ).toBe(false);
  });

  it("trims whitespace from goal", () => {
    const result = generateOutlineInputSchema.safeParse({
      goal: "  Learn worship piano  ",
      detail: "standard",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goal).toBe("Learn worship piano");
    }
  });
});

describe("courseOutlineSchema", () => {
  const validOutline = {
    title: "Worship Piano",
    description: "Learn worship piano.",
    modules: [
      {
        title: "Basics",
        description: "Getting started.",
        topics: ["Posture", "Scales"],
      },
    ],
  };

  it("accepts a valid outline", () => {
    expect(courseOutlineSchema.safeParse(validOutline).success).toBe(true);
  });

  it("accepts an outline without description", () => {
    const { description: _description, ...rest } = validOutline;
    void _description;
    expect(courseOutlineSchema.safeParse(rest).success).toBe(true);
  });

  it("defaults description to empty string", () => {
    const { description: _description, ...rest } = validOutline;
    void _description;
    const result = courseOutlineSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects a missing title", () => {
    const { title: _title, ...rest } = validOutline;
    void _title;
    expect(courseOutlineSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(
      courseOutlineSchema.safeParse({ ...validOutline, title: "  " }).success,
    ).toBe(false);
  });

  it("rejects no modules", () => {
    expect(
      courseOutlineSchema.safeParse({ ...validOutline, modules: [] }).success,
    ).toBe(false);
  });

  it("rejects a module with no title", () => {
    expect(
      courseOutlineSchema.safeParse({
        ...validOutline,
        modules: [{ title: "", description: "", topics: ["Topic"] }],
      }).success,
    ).toBe(false);
  });

  it("rejects a module with no topics", () => {
    expect(
      courseOutlineSchema.safeParse({
        ...validOutline,
        modules: [{ title: "Mod", description: "", topics: [] }],
      }).success,
    ).toBe(false);
  });

  it("rejects a module with an empty topic string", () => {
    expect(
      courseOutlineSchema.safeParse({
        ...validOutline,
        modules: [{ title: "Mod", description: "", topics: ["  "] }],
      }).success,
    ).toBe(false);
  });

  it("trims whitespace from fields", () => {
    const result = courseOutlineSchema.safeParse({
      title: "  Title  ",
      description: "  Desc  ",
      modules: [
        {
          title: "  Mod Title  ",
          description: "  Mod Desc  ",
          topics: ["  Topic 1  ", "  Topic 2  "],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Title");
      expect(result.data.description).toBe("Desc");
      expect(result.data.modules[0].title).toBe("Mod Title");
      expect(result.data.modules[0].description).toBe("Mod Desc");
      expect(result.data.modules[0].topics).toEqual(["Topic 1", "Topic 2"]);
    }
  });
});

describe("curateVideosInputSchema", () => {
  const validInput = {
    courseTitle: "Worship Piano",
    courseDescription: "Learn worship piano.",
    modules: [
      {
        moduleId: 1,
        title: "Basics",
        topics: ["Posture", "Scales"],
      },
    ],
  };

  it("accepts a valid input", () => {
    expect(curateVideosInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts optional channel and notes", () => {
    const result = curateVideosInputSchema.safeParse({
      ...validInput,
      channel: "SomeChannel",
      notes: "Prefer short videos.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channel).toBe("SomeChannel");
      expect(result.data.notes).toBe("Prefer short videos.");
    }
  });

  it("rejects a missing course title", () => {
    const { courseTitle: _courseTitle, ...rest } = validInput;
    void _courseTitle;
    expect(curateVideosInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a module missing an id", () => {
    const { moduleId: _moduleId, ...module } = validInput.modules[0];
    void _moduleId;
    expect(
      curateVideosInputSchema.safeParse({
        ...validInput,
        modules: [module],
      }).success,
    ).toBe(false);
  });

  it("rejects more than 20 modules", () => {
    const modules = Array.from({ length: 21 }, (_, i) => ({
      moduleId: i + 1,
      title: `Module ${i}`,
      topics: ["Topic"],
    }));
    expect(
      curateVideosInputSchema.safeParse({
        ...validInput,
        modules,
      }).success,
    ).toBe(false);
  });

  it("rejects an over-long course title", () => {
    expect(
      curateVideosInputSchema.safeParse({
        ...validInput,
        courseTitle: "x".repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe("searchQueriesSchema", () => {
  it("accepts valid queries", () => {
    const result = searchQueriesSchema.safeParse([
      { moduleIndex: 0, topicIndex: 0, query: "worship piano tutorial" },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(searchQueriesSchema.safeParse([]).success).toBe(false);
  });

  it("rejects an over-long query", () => {
    expect(
      searchQueriesSchema.safeParse([
        { moduleIndex: 0, topicIndex: 0, query: "x".repeat(201) },
      ]).success,
    ).toBe(false);
  });

  it("rejects non-integer indexes", () => {
    expect(
      searchQueriesSchema.safeParse([
        { moduleIndex: -1, topicIndex: 0, query: "hello" },
      ]).success,
    ).toBe(false);
  });
});

describe("topicsWithResultsSchema", () => {
  const validResult = {
    moduleIndex: 0,
    topicIndex: 0,
    query: "worship piano tutorial",
    results: [
      {
        youtubeVideoId: "AAAAAAAAAAA",
        title: "How to play worship piano",
        channelName: "Piano Teacher",
        durationSeconds: 600,
      },
    ],
  };

  it("accepts valid results", () => {
    expect(topicsWithResultsSchema.safeParse([validResult]).success).toBe(true);
  });

  it("rejects an invalid video id", () => {
    expect(
      topicsWithResultsSchema.safeParse([
        {
          ...validResult,
          results: [
            {
              youtubeVideoId: "js://not-youtube",
              title: "Bad",
              channelName: null,
              durationSeconds: null,
            },
          ],
        },
      ]).success,
    ).toBe(false);
  });
});

describe("curatedVideosSchema", () => {
  it("accepts valid videos", () => {
    const result = curatedVideosSchema.safeParse([
      { moduleId: 1, videoId: "AAAAAAAAAAA" },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(curatedVideosSchema.safeParse([]).success).toBe(false);
  });

  it("rejects an invalid video id", () => {
    expect(
      curatedVideosSchema.safeParse([
        { moduleId: 1, videoId: "not-a-video-id" },
      ]).success,
    ).toBe(false);
  });
});

describe("moduleOutlineSchema", () => {
  const validOutline = {
    title: "Chord Progressions",
    description: "Common progressions in worship.",
    topics: ["I-IV-V", "Minor keys"],
  };

  it("accepts a valid module outline", () => {
    expect(moduleOutlineSchema.safeParse(validOutline).success).toBe(true);
  });

  it("accepts an outline without description", () => {
    const { description: _description, ...rest } = validOutline;
    void _description;
    expect(moduleOutlineSchema.safeParse(rest).success).toBe(true);
  });

  it("defaults description to an empty string", () => {
    const { description: _description, ...rest } = validOutline;
    void _description;
    const result = moduleOutlineSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects a missing title", () => {
    const { title: _title, ...rest } = validOutline;
    void _title;
    expect(moduleOutlineSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(
      moduleOutlineSchema.safeParse({ ...validOutline, title: "  " }).success,
    ).toBe(false);
  });

  it("rejects no topics", () => {
    expect(
      moduleOutlineSchema.safeParse({ ...validOutline, topics: [] }).success,
    ).toBe(false);
  });

  it("rejects an empty topic string", () => {
    expect(
      moduleOutlineSchema.safeParse({
        ...validOutline,
        topics: ["  "],
      }).success,
    ).toBe(false);
  });

  it("trims whitespace from fields", () => {
    const result = moduleOutlineSchema.safeParse({
      title: "  Title  ",
      description: "  Desc  ",
      topics: ["  Topic  "],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Title");
      expect(result.data.description).toBe("Desc");
      expect(result.data.topics).toEqual(["Topic"]);
    }
  });
});

describe("generateModuleInputSchema", () => {
  const validInput = {
    courseTitle: "Worship Piano",
    courseDescription: "Learn worship piano.",
    focus: "Chord progressions",
    detail: "standard",
  };

  it("accepts a valid input", () => {
    expect(generateModuleInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts optional experience and course goal", () => {
    const result = generateModuleInputSchema.safeParse({
      ...validInput,
      courseGoal: "Play for Sunday service",
      experience: "Beginner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing focus", () => {
    const { focus: _focus, ...rest } = validInput;
    void _focus;
    expect(generateModuleInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an invalid detail level", () => {
    expect(
      generateModuleInputSchema.safeParse({
        ...validInput,
        detail: "extra",
      }).success,
    ).toBe(false);
  });

  it("rejects an over-long course title", () => {
    expect(
      generateModuleInputSchema.safeParse({
        ...validInput,
        courseTitle: "x".repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe("suggestMissingModuleInputSchema", () => {
  const validInput = {
    courseTitle: "Worship Piano",
    courseDescription: "Learn worship piano.",
    existingModules: [
      {
        title: "Basics",
        description: "Getting started.",
        lessonTitles: ["Posture", "Scales"],
      },
    ],
  };

  it("accepts a valid input", () => {
    expect(
      suggestMissingModuleInputSchema.safeParse(validInput).success,
    ).toBe(true);
  });

  it("rejects an empty existingModules list", () => {
    expect(
      suggestMissingModuleInputSchema.safeParse({
        ...validInput,
        existingModules: [],
      }).success,
    ).toBe(false);
  });

  it("rejects more than 24 modules to scan", () => {
    const existingModules = Array.from({ length: 25 }, (_, i) => ({
      title: `Module ${i}`,
      description: "",
      lessonTitles: ["Topic"],
    }));
    expect(
      suggestMissingModuleInputSchema.safeParse({
        ...validInput,
        existingModules,
      }).success,
    ).toBe(false);
  });

  it("rejects too many lesson titles per module", () => {
    expect(
      suggestMissingModuleInputSchema.safeParse({
        ...validInput,
        existingModules: [
          {
            title: "Basics",
            description: "",
            lessonTitles: Array.from({ length: 9 }, (_, i) => `Lesson ${i}`),
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an over-long course goal", () => {
    expect(
      suggestMissingModuleInputSchema.safeParse({
        ...validInput,
        courseGoal: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
