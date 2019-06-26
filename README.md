## What is this and how does it work

Same Same is a tool for joining data when the fields you want to join by aren't necessarily perfect. This happens frequently! A good example is trying to match the names of companies who have made donations to political parties with companies who are government contractors. Sometimes the names with have "PTY LTD" in them, sometimes they won't. Sometimes there's a long version of the name or a short version. Anyone who has to work with data will know about this issue.

Same Same lets you join on these fields, even if they're slightly different. It does this by first trying for perfect matches (after converting to lowercase and trimming whitespace). If it can't find a perfect match it will try a fuzzy match using the options you give it at the start. This means it is using an algorithm (Levenshtein distance) to produce a score of how similar two strings are.

Then, it gives you an interface to go through the possible matches and decide which ones you want. The interface bit is the real bonus here, as fuzzy string matching can be done easily using scripts but sorting through the matches can be annoying! This hopefully makes it a bit easier.

### Important technical information<

This is a very early build, and a whole bunch of the options don't work. It will get better over time. Use at your own risk.

You can get me at [@NickEvershed](https://twitter.com/NickEvershed) with feedback, or report a bug/issue/suggest feature/contribute at the GitHub repo here.