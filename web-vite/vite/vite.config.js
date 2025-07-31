import { defineConfig } from "vite";
import scalaJSPlugin from "@scala-js/vite-plugin-scalajs";

export default defineConfig({
    plugins: [
        scalaJSPlugin({
            // projectID: 'webVite',   // якщо sbt-root ≠ потрібний модуль
            // cwd: '..',             // шлях до build.sbt, за замовч. "."
        })
    ],
    server: {
        port: 5173,
        open: true,                // автоматично відкриє браузер
    },
    build: {
        outDir: "dist",            // прод-вивід
        emptyOutDir: true,
    },
    resolve: {
        alias: {                   // короткі імпорти у JS/TS-файлах
            "@assets": "/assets",
        },
    },
});
