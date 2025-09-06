export async function downloadFromUrl(url: string, filename: string) {
	const res = await fetch(url, { method: "GET" });
	if (!res.ok) throw new Error(`Download failed (${res.status})`);
	const blob = await res.blob();
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(link.href);
}
