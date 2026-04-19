import type { StoryDto } from "@/api/generated/model";

const storyCache = new Map<string, StoryDto>();

export function getCachedStory(id: string): StoryDto | undefined {
  return storyCache.get(id);
}

export function setCachedStory(story: StoryDto): void {
  storyCache.set(story.id, story);
}

export function removeCachedStory(id: string): void {
  storyCache.delete(id);
}
