export function getAnnotation (text: string){
    const segments = [];
    let pos = 0;
    const lines = text.split('\n');
    for (let line of lines) {
        const start = pos;
        const end = pos + line.length;
        segments.push({
            start,
            end,
            text: line
        });
        // Account for newline character not included in line
        pos = end + 1;
    }
    return segments;
}