import { beforeAll } from "vitest";
import { ensureCurriculumLoaded } from "../curriculumAccess";

beforeAll(async () => {
  await ensureCurriculumLoaded();
});
