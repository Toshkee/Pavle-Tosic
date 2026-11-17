import { Config } from "@remotion/cli/config";

/* The film is made from the site's own images and clips, so it reads them
   straight out of the site's public folder instead of keeping copies that
   would drift. The rendered file stays here, in out/: public/ only holds
   what the site references. */
Config.setPublicDir("../public");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(96);
Config.setOverwriteOutput(true);
