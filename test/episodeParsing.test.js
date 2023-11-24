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

test('Parses episode', () => {
	const data = `{{episode|previous=Episode 8109|next=Episode 8111}}
'''Episode 8110''' was broadcast on 21 September 2023, as part of [[Series 88]].

[[Paul O'Brien]] played [[Ravi Jay]], with Paul O'Brien winning {{score|103|16}}. The [[Dictionary Corner]] guest was [[Chris McCausland]], and the [[lexicographer]] was [[Susie Dent]].

NOTE: The [[conundrum]] had two valid solutions – {{word|CERTAINLY}} and {{word|CLIENTARY}}.

==Rounds==
{{Rounds-start|Paul O'Brien|Ravi Jay}}
{{R-letters  |1 |NFOERHODI|HORNED   |honored {{x}}|FORDONE*            |  6|0  |  7}}
{{R-letters  |2 |EIERBSRSM|MESSIER  |MISER    |BEMIRES*, BERRIES, BIREMES*, MERISES*, MISERES*, REMISES*, RIBESES*| 13|0  | 14}}
{{R-numbers  |3 | 25|6|3|8|1|7| 961
|958|sol1=(7 × 6 − 3 − 1) × 25 + 8
|&mdash;
|other=961|solother=(25 + 7) × (8 × 3 + 6) + 1
|20|0|24}}
{{R-TTT         |EATBEANS|Do they keep the Irishmen on the straight and narrow?|BANATEES}}
{{R-letters  |4 |OEOPDGYDR|POGOED   |DODGER   |DROOPED, GODDERY*   | 26|6  | 31}}
{{R-letters  |5 |VBEALDUNO|UNLOVED  |UNABLE   |UNDOABLE            | 33|6  | 39}}
{{R-numbers  |6 | 75|25|100|50|9|8| 117
|117|sol1=100 + 75 + 9 + 8 − 50 − 25
|117|sol2=100 + 9 + 8
|43|16|49}}
{{R-letters  |7 |PTSEAPEDR|STRAPPED |SPEARED  |PEDERAST*, PREDATES*, PRETAPED*, PRETAPES*, TRAPESED*| 51|16 | 57}}
{{R-letters  |8 |AIENKDTWS|STAINED  |stinked {{x}}|WANKIEST*           | 58|16 | 65}}
{{R-numbers  |9 | 75|9|8|3|10|6| 710
|710|sol1=(75 − (6 − 3 + 9 − 8)) × 10
|711
|68|16|75}}
{{R-TTT         |RATEHEAD|The beverage of choice for some online factions.|HATERADE}}
{{R-letters  |10|UOECRGNAG|COURAGE  |GAUGE    |EGGCORN*            | 75|16 | 82}}
{{R-letters  |11|EOASLTNIR|LOANERS  |ROAST    |ORIENTALS*, RELATIONS, ROTALINES*, TENSORIAL*| 82|16 |100}}
{{R-letters  |12|EOISRNJMC|REJOINS  |NOISE    |INCOMERS*, SERMONIC | 89|16 |108}}
{{R-letters  |13|UAENTMSIM|AUNTIES  | &mdash; |MANUMISE*, MANUMITS, MAUNTIES*, MISMEANT*| 96|16 |116}}
{{R-numbers  |14| 50|25|75|100|6|6| 832
|831|sol1=(100 + 25) × 6 + 75 + 6
|825
|other=832|solother=((75 − 6) × 50 × 6 + 100) ÷ 25
|103|16|126}}
{{R-conundrum|15|NEILTRACY|sol=CERTAINLY**|103|16|136}}
{{Rounds-end}}

{{DEFAULTSORT:8110}}
[[Category:15-round games]]
[[Category:Episodes in Series 88]]
[[Category:15-round scores under 30]]
[[Category:Episodes presented by Colin Murray]]
[[Category:Episodes with Rachel Riley as arithmetician]]
[[Category:Episodes with Susie Dent as lexicographer]]
[[Category:Episodes with Chris McCausland as a guest]]
[[Category:Episodes affected by administrative errors]]`;
	const x = parseEpisode(data, 8110);
	const y = getMessages();
	console.log(y);
	expect(y.length).toBe(0);
});
