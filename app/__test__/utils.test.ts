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
});
