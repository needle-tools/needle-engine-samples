import "./register_types"

export const needle_exported_files = [];
globalThis["needle:codegen_files"] = needle_exported_files;
needle_exported_files.push("./assets/next.glb?v=1684227695006");

document.addEventListener("DOMContentLoaded", () =>
{
	const needleEngine = document.querySelector("needle-engine");
	if(needleEngine && needleEngine.getAttribute("src") === null)
	{
		needleEngine.setAttribute("hash", "1684227695006");
		needleEngine.setAttribute("src", JSON.stringify(needle_exported_files));
	}
});

console.log("Made\ with\ ♥\ by\ 🌵\ Needle\ -\ https://needle\.tools\ —\ Version\ 3\.5\.8-exp");
