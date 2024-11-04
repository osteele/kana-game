import { describe, expect, it } from "bun:test";
import { getSimilarCharacters, isHiragana, isKatakana } from './kana';

describe('getSimilarCharacters', () => {
  it('returns all similar hiragana characters', () => {
    expect(getSimilarCharacters('の')).toEqual(['ぬ']);
    // 'の' appears in multiple sets, should get all similar characters
    expect(getSimilarCharacters('ぬ')).toEqual(['す', 'め', 'の']);
  });

  it('returns all similar katakana characters', () => {
    expect(getSimilarCharacters('ソ')).toEqual(['シ', 'ツ', 'ン', 'ノ']);
    expect(getSimilarCharacters('ン')).toEqual(['シ', 'ツ', 'ソ', 'ノ']);
  });

  it('handles compound characters', () => {
    expect(getSimilarCharacters('きゃ')).toEqual(['さゃ']);
    expect(getSimilarCharacters('キャ')).toEqual([]);
  });

  it('respects writing system boundaries when allowOppositeSet is false', () => {
    expect(getSimilarCharacters('き')).toEqual(['さ']);
    expect(getSimilarCharacters('キ')).toEqual([]);
  });

  it('finds cross-writing-system similarities when allowOppositeSet is true', () => {
    expect(getSimilarCharacters('き', true)).toEqual(['さ', 'キ']);
    expect(getSimilarCharacters('キ', true)).toEqual(['き']);
  });
});

describe('isHiragana', () => {
  it('correctly identifies hiragana characters', () => {
    expect(isHiragana('あ')).toBe(true);
    expect(isHiragana('ア')).toBe(false);
    expect(isHiragana('きゃ')).toBe(true);
  });
});

describe('isKatakana', () => {
  it('correctly identifies katakana characters', () => {
    expect(isKatakana('ア')).toBe(true);
    expect(isKatakana('あ')).toBe(false);
    expect(isKatakana('キャ')).toBe(true);
  });
});
