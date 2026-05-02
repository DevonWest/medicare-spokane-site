import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GOOGLE_REVIEW_URL,
  getReviewRatingDestination,
  validateReviewFeedbackInput,
} from "../lib/reviewFlow";
import { getActiveReviewableTeamMembers, getTeamMemberSlug } from "../lib/team";

test("5-star rating redirects to the Google review page", () => {
  assert.equal(getReviewRatingDestination("kristi-wright", 5), GOOGLE_REVIEW_URL);
});

test("1-4 star ratings go to the internal feedback page with rating and agent params", () => {
  assert.equal(
    getReviewRatingDestination("kristi-wright", 4),
    "/review/feedback?agent=kristi-wright&rating=4",
  );
  assert.equal(
    getReviewRatingDestination("kristi-wright", 1),
    "/review/feedback?agent=kristi-wright&rating=1",
  );
});

test("reviewable team members include the active agents and exclude retired or non-reviewable staff", () => {
  const names = getActiveReviewableTeamMembers().map((member) => member.name);

  assert.deepEqual(names, [
    "Lynn Wold",
    "Craig Lenhart",
    "Meg Shumaker",
    "Rose Records",
    "Sheryl Manchester",
    "Devon West",
    "Denise Chan",
    "Kristi Wright",
    "Cathy Franklin",
  ]);
  assert.ok(!names.includes("Karen Speerstra"));
  assert.ok(!names.includes("Karen Christensen"));
  assert.ok(!names.includes("Anna Parker"));
  assert.ok(!names.includes("Val Trca"));
  assert.equal(getTeamMemberSlug("Kristi Wright"), "kristi-wright");
});

test("review feedback validation rejects rating 5 for internal feedback", () => {
  const validation = validateReviewFeedbackInput({
    fullName: "Jane Doe",
    email: "jane@example.com",
    rating: 5,
    message: "Needs follow-up.",
    sourcePath: "/review/feedback",
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.errors.rating, "Please choose a rating between 1 and 4 stars.");
});
