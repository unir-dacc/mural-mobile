import { Image } from "expo-image";
import { listStories } from "@/api/generated/api";
import type { GetPaginatedPostDtoDataItem, GetPostDto, StoryDto } from "@/api/generated/model";

function isRemoteUri(uri?: string | null): uri is string {
  return typeof uri === "string" && /^https?:\/\//i.test(uri);
}

export function useCachedMediaUri(uri?: string | null) {
  return uri ?? undefined;
}

export function warmMediaCache(urls: Array<string | null | undefined>) {
  const uniqueUrls = Array.from(new Set(urls.filter(isRemoteUri)));
  if (uniqueUrls.length === 0) return;

  void Image.prefetch(uniqueUrls, "disk");
}

function collectPostUrls(posts: Array<GetPaginatedPostDtoDataItem | GetPostDto>) {
  const urls: string[] = [];

  posts.forEach((post) => {
    if (post.thumbnailUrl) {
      urls.push(post.thumbnailUrl);
    }

    post.Media?.forEach((media) => {
      if (media.imageUrl) {
        urls.push(media.imageUrl);
      }
    });
  });

  return urls;
}

export function warmPostsMediaCache(posts: Array<GetPaginatedPostDtoDataItem | GetPostDto>) {
  warmMediaCache(collectPostUrls(posts));
}

export function warmStoryMediaCache(story: StoryDto | null | undefined) {
  if (!story) return;

  warmMediaCache([
    story.coverImageUrl,
    ...(story.items?.flatMap((item) => [item.imageUrl, item.thumbnailUrl]) ?? []),
  ]);
}

export async function warmLatestStoriesMediaCache() {
  try {
    const stories = await listStories();
    warmMediaCache(stories.flatMap((story) => [story.coverImageUrl]));
  } catch {
    //
  }
}

export function syncAllMuralMediaCache() {
  return Promise.resolve();
}
