import { parseEpisode } from '../src/episodeParsing';
import { getMessages } from '../src/log';

test('Parses episode', () => {
	const data = `{{episode|previous=Episode 8020|next=Episode 8022}}
'''Episode 8021''' was broadcast on 19 May 2023, as part of [[Series 87]].

[[Ronan Higginson]] played [[Greg Raine]], with Ronan Higginson winning {{score|126|12}}. The [[Dictionary Corner]] guest was [[Annie Macmanus]], and the [[lexicographer]] was [[Susie Dent]].

==Rounds==
{{Rounds-start|Ronan Higginson|Greg Raine}}
{{R-letters  |1 |OEIANTRSC|CREATIONS|STAIN    |ACTIONERS, ACTORINES*, NARCOTISE, REACTIONS| 18|0  | 18}}
{{R-letters  |2 |ERGWOEPMA|GAPEWORM |WAGER    |                    | 26|0  | 26}}
{{R-numbers  |3 | 25|4|6|10|8|1| 468
|468|sol1=(10 + 8) × (25 + 1)
|467
|36|0|36}}
{{R-TTT         |VIOLETRAT|Does he put tax on a jacket spud? How uplifting.|LEVITATOR}}
{{R-letters  |4 |TLTIOENTO|LOTION   |LOTION   |LOONIE*, OOLITE*, TIENTO*, TITTLE, TOILET*, TOOLIE*, TOONIE*, TOOTLE| 42|6  | 42}}
{{R-letters  |5 |AEIGBNSAY|SAYING   |SAYING   |ABASING, ABEYING*, GAINSAY| 48|12 | 49}}
{{R-numbers  |6 | 25|9|6|1|2|4| 185
|185|sol1=(25 − 4) × 9 + 2 − 6
|179
|58|12|59}}
{{R-letters  |7 |UOEKTQUNL|UNQUOTE  |TOKEN    |                    | 65|12 | 66}}
{{R-letters  |8 |GMTAIEHFA|MEGAHIT  |HATE     |                    | 72|12 | 73}}
{{R-numbers  |9 | 25|10|8|10|5|4| 732
|731|sol1=(10 × 10 − 5) × 8 − 25 − 4
|720
|rr=732|solrr=(25 × 10 − (10 − 4)) × (8 − 5)
|79|12|83}}
{{R-TTT         |GREATROPY|She felt great when she arrived and very ropy when she left.|PARTYGOER}}
{{R-letters  |10|MPRNIEADI|IMPAIRED |PRIMED   |MERIDIAN            | 87|12 | 91}}
{{R-letters  |11|TSJAUERIH|THESAURI |TRIES    |                    | 95|12 | 99}}
{{R-letters  |12|STPCOAOEG|POSTAGE  |CAGES    |CAPOTES, POTAGES*, TOECAPS*|102|12 |106}}
{{R-letters  |13|AEUDRWROS|REWARDS  |erodes {{x}}|ADORERS*, ADROWSE*, AROUSED, ARRODES*, ARROWED, DRAWERS*, DROSERA, REDOWAS*, REDRAWS*, REWORDS*, ROADERS*, WARDERS*, WOADERS*|109|12 |113}}
{{R-numbers  |14| 75|1|4|2|7|10| 938
|940|sol1=(7 × 2 + 75 + 4 + 1) × 10
|&mdash;
|rr=938|solrr=(4 + 7) × (75 + 10) + 1 + 2
|116|12|123}}
{{R-conundrum|15|BITEBULBS|c1time=0.75|c1sol=BUBBLIEST|126|12|133}}
{{Rounds-end}}

{{DEFAULTSORT:8021}}
[[Category:15-round games]]
[[Category:Episodes in Series 87]]
[[Category:Episodes presented by Colin Murray]]
[[Category:Episodes with Rachel Riley as arithmetician]]
[[Category:Episodes with Susie Dent as lexicographer]]
[[Category:Episodes with Annie Macmanus as a guest]]
[[Category:Scores over 125]]
[[Category:15-round scores under 30]]
[[Category:Wins by over 100]]`;
	const x = parseEpisode(data, 8021);
	const y = getMessages();
	console.log(y);
	expect(y.length).toBe(0);
});
