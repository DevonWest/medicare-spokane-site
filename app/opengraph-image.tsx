import { createSocialImage } from "@/lib/socialImage";

export const alt =
  "Medicare in Spokane by Health Insurance Options — local Medicare and health insurance guidance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialImage();
}
