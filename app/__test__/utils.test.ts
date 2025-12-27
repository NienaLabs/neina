/**
 * @jest-environment jsdom
 */
/// <reference types="jest" />
import {
  lastAssistantTextMessageContent,
  handleFieldChange,
  handleNestedFieldChange,
  handleArrayAdd,
  handleArrayDelete,
  handleAddressChange,
  handleOtherLinksChange,
  addNewOtherLink,
  handleSkillArrayChange,
  addSkill,
  removeSkill,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
  cosineSimilarity,
  parseVectorString,
  validJson,
} from '@/lib/utils';
import { AgentResult, TextMessage } from '@inngest/agent-kit';
import { ResumeExtraction } from '@/components/resume/editor/types';

// Mock dependencies that are not directly tested
jest.mock('clsx', () => jest.fn((...args) => args.filter(Boolean).join(' ')));
jest.mock('tailwind-merge', () => jest.fn((...args) => args.join(' ')));

describe('lastAssistantTextMessageContent', () => {
  it('should return undefined if there are no messages', () => {
    const result: AgentResult = { output: [] };
    expect(lastAssistantTextMessageContent(result)).toBeUndefined();
  });

  it('should return undefined if there are no assistant messages', () => {
    const result = {
      output: [{ role: 'user', content: 'Hello' } as TextMessage],
    };
    expect(lastAssistantTextMessageContent(result as AgentResult)).toBeUndefined();
  });

  it('should return the content of the last assistant text message (string)', () => {
    const result = {
      output: [
        { role: 'assistant', content: 'First message' } as TextMessage,
        { role: 'user', content: 'A user message' } as TextMessage,
        { role: 'assistant', content: 'Last message' } as TextMessage,
      ],
    };
    expect(lastAssistantTextMessageContent(result as AgentResult)).toBe('Last message');
  });

  it('should return the concatenated content of the last assistant text message (array)', () => {
    const result = {
      output: [
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'World' }],
        } as unknown as TextMessage,
      ],
    };
    expect(lastAssistantTextMessageContent(result as AgentResult)).toBe('Hello World');
  });

  it('should return undefined if the assistant message has no content', () => {
    const result = {
      output: [{ role: 'assistant' } as unknown as TextMessage],
    };
    expect(lastAssistantTextMessageContent(result as AgentResult)).toBeUndefined();
  });
});

describe('Resume Editor Helpers', () => {
  let setEditorState: jest.Mock;
  let setSave: jest.Mock;
  let initialEditorState: ResumeExtraction;

  beforeEach(() => {
    setEditorState = jest.fn();
    setSave = jest.fn();
    initialEditorState = {
      name: 'John Doe',
      experience: [{ title: 'Engineer', company: 'Tech Inc.' }],
      address: {
        city: 'San Francisco',
        country: 'USA',
        otherLinks: ['linkedin.com/johndoe'],
      },
      skills: {
        technical: ['JavaScript', 'React'],
        soft: ['Communication'],
      },
    } as ResumeExtraction;
  });

  describe('handleFieldChange', () => {
    it('should update a top-level field', () => {
      handleFieldChange('name', 'Jane Doe', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.name).toBe('Jane Doe');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleNestedFieldChange', () => {
    it('should update a field in a nested object within an array', () => {
      handleNestedFieldChange('experience', 0, 'title', 'Senior Engineer', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience[0].title).toBe('Senior Engineer');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleArrayAdd', () => {
    it('should add a new item to an array', () => {
      const newItem = { title: 'Developer', company: 'New Co' };
      handleArrayAdd('experience', newItem, setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience).toHaveLength(2);
      expect(newState.experience[1]).toEqual(newItem);
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleArrayDelete', () => {
    it('should delete an item from an array', () => {
      handleArrayDelete('experience', 0, setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience).toHaveLength(0);
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleAddressChange', () => {
    it('should update a field in the address object', () => {
      handleAddressChange('city', 'New York', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.address.city).toBe('New York');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleOtherLinksChange', () => {
    it('should update a link in the otherLinks array', () => {
      handleOtherLinksChange(0, 'github.com/johndoe', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.address.otherLinks[0]).toBe('github.com/johndoe');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('addNewOtherLink', () => {
    it('should add a new empty link to otherLinks', () => {
      addNewOtherLink(setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.address.otherLinks).toHaveLength(2);
      expect(newState.address.otherLinks[1]).toBe('');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleSkillArrayChange', () => {
    it('should update a skill in a skill array', () => {
      handleSkillArrayChange('technical', 0, 'TypeScript', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.skills.technical[0]).toBe('TypeScript');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('addSkill', () => {
    it('should add a new empty skill to a skill array', () => {
      addSkill('technical', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.skills.technical).toHaveLength(3);
      expect(newState.skills.technical[2]).toBe('');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('removeSkill', () => {
    it('should remove a skill from a skill array', () => {
      removeSkill('technical', 0, setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.skills.technical).toHaveLength(1);
      expect(newState.skills.technical[0]).toBe('React');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('handleCustomFieldChange', () => {
    beforeEach(() => {
      initialEditorState = {
        ...initialEditorState,
        experience: [{
          title: 'Engineer',
          company: 'Tech Inc.',
          customFields: [{ key: 'location', value: 'Remote' }]
        }]
      } as ResumeExtraction;
    });

    it('should update the key of a custom field', () => {
      handleCustomFieldChange('experience', 0, 0, 'key', 'office', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience[0].customFields[0].key).toBe('office');
      expect(setSave).toHaveBeenCalledWith(true);
    });

    it('should update the value of a custom field', () => {
      handleCustomFieldChange('experience', 0, 0, 'value', 'Hybrid', setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience[0].customFields[0].value).toBe('Hybrid');
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('addCustomField', () => {
    it('should add a new custom field to a section item', () => {
      addCustomField('experience', 0, setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience[0].customFields).toBeDefined();
      expect(newState.experience[0].customFields.length).toBeGreaterThan(0);
      expect(newState.experience[0].customFields[newState.experience[0].customFields.length - 1]).toEqual({ key: '', value: '' });
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });

  describe('removeCustomField', () => {
    beforeEach(() => {
      initialEditorState = {
        ...initialEditorState,
        experience: [{
          title: 'Engineer',
          company: 'Tech Inc.',
          customFields: [
            { key: 'location', value: 'Remote' },
            { key: 'type', value: 'Full-time' }
          ]
        }]
      } as ResumeExtraction;
    });

    it('should remove a custom field from a section item', () => {
      removeCustomField('experience', 0, 0, setEditorState, setSave);
      expect(setEditorState).toHaveBeenCalledWith(expect.any(Function));
      const updater = setEditorState.mock.calls[0][0];
      const newState = updater(initialEditorState);
      expect(newState.experience[0].customFields).toHaveLength(1);
      expect(newState.experience[0].customFields[0]).toEqual({ key: 'type', value: 'Full-time' });
      expect(setSave).toHaveBeenCalledWith(true);
    });
  });
});

describe('Vector and Math Utilities', () => {
  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity for identical vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1.0);
    });

    it('should calculate cosine similarity for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0.0);
    });

    it('should calculate cosine similarity for opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1.0);
    });

    it('should return 0 for zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      expect(cosineSimilarity(vec1, vec2)).toBe(0);
    });

    it('should throw error for vectors of different lengths', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];
      expect(() => cosineSimilarity(vec1, vec2)).toThrow('Vectors must be of the same length');
    });

    it('should handle decimal values correctly', () => {
      const vec1 = [0.5, 0.8, 0.2];
      const vec2 = [0.3, 0.9, 0.1];
      const result = cosineSimilarity(vec1, vec2);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});

describe('Parsing Utilities', () => {
  describe('parseVectorString', () => {
    it('should parse a valid JSON array string', () => {
      const vectorStr = '[1, 2, 3, 4, 5]';
      const result = parseVectorString(vectorStr);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return empty array for null input', () => {
      expect(parseVectorString(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(parseVectorString(undefined)).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = parseVectorString('invalid json');
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string', () => {
      expect(parseVectorString('')).toEqual([]);
    });
  });

  describe('validJson', () => {
    it('should parse valid JSON', () => {
      const jsonStr = '{"name": "John", "age": 30}';
      const result = validJson(jsonStr);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should repair and parse invalid JSON with missing quotes', () => {
      const jsonStr = '{name: "John", age: 30}';
      const result = validJson(jsonStr);
      expect(result).toBeTruthy();
      expect(result.name).toBe('John');
    });

    it('should repair and parse JSON with trailing commas', () => {
      const jsonStr = '{"name": "John", "age": 30,}';
      const result = validJson(jsonStr);
      expect(result).toBeTruthy();
      expect(result.name).toBe('John');
    });

    it('should return null for completely invalid JSON', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = validJson('this is not json at all {{{');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty object', () => {
      const result = validJson('{}');
      expect(result).toEqual({});
    });

    it('should handle arrays', () => {
      const result = validJson('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });
  });
});

