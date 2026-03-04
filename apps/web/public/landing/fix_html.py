with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_rm = None
end_rm = None
hero_content_count = 0

for i, line in enumerate(lines):
    s = line.strip()
    if '<div class="hero-content">' in s:
        hero_content_count += 1
        if hero_content_count == 1:
            start_rm = i + 1  # start removing after first hero-content
    if '<div class="hero-slot-row">' in s and start_rm is not None:
        end_rm = i
        break

print(f"Removing lines {start_rm} to {end_rm-1} ({end_rm - start_rm} lines)")
print("First removed:", lines[start_rm].strip()[:80])
print("Last removed:", lines[end_rm-1].strip()[:80])

clean = lines[:start_rm] + lines[end_rm:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(clean)

print("Done,", len(clean), "lines")
