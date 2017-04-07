/* eslint-disable */
const animalChannels = [
"abandoned-bontebok" ,
"aberrant-curlew" ,
"aberrant-hippopotamus" ,
"abhorrent-sunbird" ,
"abhorrent-wapiti" ,
"abject-blackbird" ,
"ablaze-coot" ,
"ablaze-galah" ,
"ablaze-starfish" ,
"ablaze-woodchuck" ,
"able-jaguar" ,
"able-macaque" ,
"able-waterbuck" ,
"abnormal-egret" ,
"abnormal-hyena" ,
"abortive-godwit" ,
"abrasive-monster" ,
"absorbing-hedgehog" ,
"abstracted-goat" ,
"abundant-eland" ,
"abundant-mockingbird" ,
"abusive-tayra" ,
"accidental-tortoise" ,
"accurate-platypus" ,
"acidic-duck" ,
"acoustic-jaguarundi" ,
"acrid-zorro" ,
"addicted-dragon" ,
"adhesive-tanager" ,
"adjoining-darter" ,
"adorable-bettong" ,
"adorable-pintail" ,
"adventurous-bettong" ,
"adventurous-chimpanzee" ,
"adventurous-cobra" ,
"adventurous-heron" ,
"afraid-white-eye" ,
"agitated-godwit" ,
"agitated-hawk-eagle" ,
"agonizing-hummingbird" ,
"agreeable-wambenger" ,
"ahead-chuckwalla" ,
"ahead-skink" ,
"alcoholic-ibis" ,
"alcoholic-lark" ,
"alike-ostrich" ,
"alive-puffin" ,
"alleged-skunk" ,
"amazing-peccary" ,
"ambiguous-boa" ,
"ambitious-grebe" ,
"amiable-goat" ,
"amiable-starfish" ,
"amuck-langur" ,
"ancient-ant" ,
"ancient-kite" ,
"animated-meerkat" ,
"apathetic-chickadee" ,
"apathetic-lizard" ,
"apathetic-marten" ,
"appalling-possum" ,
"appalling-shrike" ,
"apprehensive-currasow" ,
"apprehensive-goose" ,
"aromatic-cardinal" ,
"aromatic-hippopotamus" ,
"ashamed-opossum" ,
"ashamed-ostrich" ,
"ashamed-sidewinder" ,
"aspiring-colobus" ,
"assorted-jaeger" ,
"assorted-phascogale" ,
"astonishing-klipspringer" ,
"attractive-lark" ,
"auspicious-mouse" ,
"automatic-quoll" ,
"available-duiker" ,
"average-glider" ,
"awake-raven" ,
"awake-stilt" ,
"axiomatic-quail" ,
"axiomatic-ringtail" ,
"barbarous-corella" ,
"barbarous-mouse" ,
"beautiful-gnu" ,
"beautiful-klipspringer" ,
"beefy-drongo" ,
"beefy-tarantula" ,
"befitting-urial" ,
"belligerent-klipspringer" ,
"belligerent-whale" ,
"beneficial-turaco" ,
"bent-crane" ,
"berserk-corella" ,
"berserk-macaw" ,
"berserk-skimmer" ,
"better-bat" ,
"bewildered-jacana" ,
"billowy-caracal" ,
"biting-glider" ,
"bitter-guerza" ,
"bitter-pintail" ,
"bizarre-catfish" ,
"bizarre-deer" ,
"bizarre-lynx" ,
"bland-macaw" ,
"blue-partridge" ,
"blushing-hawk" ,
"blushing-onager" ,
"blushing-peacock" ,
"boiling-pademelon" ,
"boorish-jaeger" ,
"boorish-skua" ,
"boorish-wolf" ,
"bouncy-llama" ,
"boundless-topi" ,
"brainy-tinamou" ,
"brawny-frogmouth" ,
"breezy-adouri" ,
"brief-boubou" ,
"broad-spurfowl" ,
"broken-pheasant" ,
"bulky-hawk-eagle" ,
"bumpy-tsessebe" ,
"busy-ovenbird" ,
"cagey-bustard" ,
"cagey-iguana" ,
"cagey-lapwing" ,
"calculating-gopher" ,
"callous-kookaburra" ,
"callous-teal" ,
"calm-alligator" ,
"capable-topi" ,
"capricious-hoopoe" ,
"careful-gaur" ,
"caring-bear" ,
"caring-lemming" ,
"cautious-reindeer" ,
"changeable-sunbird" ,
"charming-cardinal" ,
"cheeky-serval" ,
"chemical-lapwing" ,
"chemical-macaque" ,
"chemical-monster" ,
"chief-yak" ,
"chivalrous-monkey" ,
"chivalrous-ox" ,
"chivalrous-tortoise" ,
"chunky-paradoxure" ,
"clammy-baboon" ,
"clammy-tayra" ,
"clean-racer" ,
"clever-impala" ,
"cloistered-gulls" ,
"cloistered-kudu" ,
"cloistered-porcupine" ,
"closed-coot" ,
"cloudy-coot" ,
"clumsy-quail" ,
"cluttered-jackrabbit" ,
"cluttered-partridge" ,
"cold-jaguarundi" ,
"colorful-leopard" ,
"comfortable-buffalo" ,
"comfortable-echidna" ,
"complete-hyena" ,
"concerned-partridge" ,
"concerned-sloth" ,
"condescending-aardwolf" ,
"confused-dragon" ,
"conscious-godwit" ,
"contemplative-capybara" ,
"convincing-birds" ,
"coordinated-hedgehog" ,
"corny-ostrich" ,
"crazy-suricate" ,
"crowded-klipspringer" ,
"cuddly-blackbuck" ,
"cumbersome-gaur" ,
"cumbersome-roller" ,
"cumbersome-shrew" ,
"curly-ant" ,
"cut-sandpiper" ,
"daffy-lory" ,
"damaged-dunnart" ,
"damp-buffalo" ,
"dangerous-gopher" ,
"dashing-bandicoot" ,
"dazzling-white-eye" ,
"deafening-rattlesnake" ,
"debonair-cougar" ,
"decorous-python" ,
"decorous-weaver" ,
"deeply-jackal" ,
"deeply-shrew" ,
"defeated-wolf" ,
"defective-plover" ,
"defective-spoonbill" ,
"delicate-cow" ,
"delightful-darter" ,
"delirious-zebra" ,
"dependent-jaguar" ,
"dependent-potoroo" ,
"depraved-baboon" ,
"depraved-malleefowl" ,
"descriptive-bandicoot" ,
"descriptive-bushpig" ,
"descriptive-kinkajou" ,
"despicable-groundhog" ,
"despicable-koala" ,
"different-boubou" ,
"different-racer" ,
"difficult-bulbul" ,
"dilapidated-crane" ,
"dilapidated-genoveva" ,
"diminutive-koala" ,
"disagreeable-tiger" ,
"disastrous-jacana" ,
"disgusted-caracara" ,
"disgusted-oribi" ,
"disgusting-catfish" ,
"disgusting-woodrat" ,
"dispensable-turtle" ,
"disposed-baboon" ,
"distinct-iguana" ,
"distinct-weaver" ,
"distraught-sambar" ,
"disturbed-grison" ,
"disturbed-mantis" ,
"divergent-gonolek" ,
"divergent-mockingbird" ,
"dizzy-sloth" ,
"domineering-gazelle" ,
"domineering-gulls" ,
"drab-lemur" ,
"drab-wallaby" ,
"dramatic-sheathbill" ,
"drunk-civet" ,
"dull-duck" ,
"dull-mongoose" ,
"dynamic-macaw" ,
"early-phascogale" ,
"earsplitting-glider" ,
"earsplitting-waterbuck" ,
"earthy-chameleon" ,
"eatable-coyote" ,
"efficacious-currasow" ,
"efficacious-grenadier" ,
"efficacious-shark" ,
"efficacious-wolf" ,
"elastic-bushbaby" ,
"elastic-hedgehog" ,
"elated-cockatoo" ,
"electric-roadrunner" ,
"elegant-kudu" ,
"embarrassed-jaguarundi" ,
"empty-fisher" ,
"enchanted-gerenuk" ,
"endurable-boa" ,
"endurable-nyala" ,
"endurable-woodrat" ,
"energetic-gulls" ,
"enormous-pie" ,
"enthusiastic-hawk" ,
"envious-parakeet" ,
"equable-blesbok" ,
"erratic-cottonmouth" ,
"erratic-crane" ,
"ethereal-serval" ,
"evanescent-whale" ,
"evasive-chickadee" ,
"evasive-coyote" ,
"even-grenadier" ,
"evil-vicuna" ,
"excited-stork" ,
"exciting-chickadee" ,
"exhilarated-blackbird" ,
"exotic-godwit" ,
"exotic-tinamou" ,
"expensive-gerenuk" ,
"expensive-ibis" ,
"extensive-dog" ,
"extensive-gazer" ,
"extensive-monkey" ,
"exuberant-badger" ,
"exuberant-dove" ,
"exuberant-pronghorn" ,
"faded-hyrax" ,
"fair-parakeet" ,
"faithful-mouse" ,
"false-kangaroo" ,
"false-sparrow" ,
"false-wildebeest" ,
"fanatical-woodpecker" ,
"fashioned-mouflon" ,
"fashioned-pie" ,
"faulty-hedgehog" ,
"fearful-nuthatch" ,
"feigned-springbuck" ,
"festive-malleefowl" ,
"few-caracara" ,
"few-whale" ,
"fine-oryx" ,
"first-koala" ,
"first-paradoxure" ,
"five-lapwing" ,
"flaky-openbill" ,
"flaky-whale" ,
"flashy-chuckwalla" ,
"flashy-sandgrouse" ,
"flat-ocelot" ,
"flawless-eland" ,
"flimsy-buffalo" ,
"flimsy-moccasin" ,
"flippant-currasow" ,
"flippant-fisher" ,
"floppy-alpaca" ,
"floppy-elk" ,
"flowery-ostrich" ,
"flowery-robin" ,
"fluffy-iguana" ,
"fluffy-mantis" ,
"foamy-sandpiper" ,
"foolish-oribi" ,
"foregoing-kinkajou" ,
"forgetful-elephant" ,
"forgetful-tamandua" ,
"fortunate-racer" ,
"four-flamingo" ,
"fragile-puffin" ,
"frantic-phascogale" ,
"frantic-potoroo" ,
"frantic-urial" ,
"free-civet" ,
"freezing-bear" ,
"freezing-coatimundi" ,
"freezing-deer" ,
"freezing-ringtail" ,
"freezing-sunbird" ,
"frequent-emu" ,
"friendly-aardwolf" ,
"friendly-tenrec" ,
"frightened-caiman" ,
"futuristic-spoonbill" ,
"fuzzy-sidewinder" ,
"fuzzy-spider" ,
"gamy-sparrow" ,
"garrulous-gonolek" ,
"garrulous-kiskadee" ,
"garrulous-quail" ,
"gentle-hyena" ,
"gentle-impala" ,
"gentle-serval" ,
"ghastly-drongo" ,
"giant-viper" ,
"giddy-avocet" ,
"giddy-mantis" ,
"gleaming-wildebeest" ,
"glib-butterfly" ,
"glib-kinkajou" ,
"glib-roadrunner" ,
"glorious-potoroo" ,
"good-fowl" ,
"gorgeous-crab" ,
"graceful-lemur" ,
"graceful-pie" ,
"grandiose-serval" ,
"grateful-ostrich" ,
"gratis-caracal" ,
"gratis-elk" ,
"gray-mara" ,
"great-meerkat" ,
"green-squirrel" ,
"grey-toucan" ,
"grieving-jaeger" ,
"grotesque-genoveva" ,
"grouchy-tayra" ,
"gruesome-lynx" ,
"grumpy-turtle" ,
"guarded-caracara" ,
"guarded-porcupine" ,
"gullible-rhinoceros" ,
"guttural-moose" ,
"half-paradoxure" ,
"hallowed-springbuck" ,
"halting-llama" ,
"handsome-ostrich" ,
"hanging-francolin" ,
"harebrained-lorikeet" ,
"hateful-hedgehog" ,
"heady-dragonfly" ,
"heavenly-malleefowl" ,
"heavenly-osprey" ,
"helpless-bustard" ,
"helpless-flamingo" ,
"hesitant-sparrow" ,
"hideous-tinamou" ,
"hideous-weaver" ,
"highfalutin-dog" ,
"hissing-blesbok" ,
"holistic-opossum" ,
"hollow-sungazer" ,
"homeless-sifaka" ,
"horrible-serval" ,
"horrific-caribou" ,
"horrific-corella" ,
"huge-bee-eater" ,
"huge-manatee" ,
"humdrum-peccary" ,
"humorous-nighthawk" ,
"humorous-tortoise" ,
"hurried-camel" ,
"hurried-goldeneye" ,
"hurried-kongoni" ,
"hurt-bat" ,
"husky-blackbuck" ,
"husky-shrew" ,
"husky-trotter" ,
"hysterical-grouse" ,
"hysterical-guanaco" ,
"hysterical-heron" ,
"icky-lemur" ,
"icy-owl" ,
"icy-wambenger" ,
"ignorant-bat" ,
"illegal-tsessebe" ,
"imaginary-shrew" ,
"immense-cormorant" ,
"immense-jackrabbit" ,
"immense-reedbuck" ,
"immense-woodrat" ,
"impartial-hedgehog" ,
"impolite-mynah" ,
"imported-elephant" ,
"imported-serval" ,
"imported-woodrat" ,
"impossible-gazelle" ,
"incompetent-colobus" ,
"inconclusive-gemsbok" ,
"incredible-boa" ,
"incredible-crake" ,
"incredible-raccoon" ,
"industrious-ferret" ,
"inexpensive-nilgai" ,
"inexpensive-shrike" ,
"infamous-crocodile" ,
"infamous-dassie" ,
"innate-tinamou" ,
"insidious-bushpig" ,
"insidious-grebe" ,
"instinctive-nyala" ,
"intelligent-coyote" ,
"interesting-tern" ,
"intrigued-mongoose" ,
"irritable-creeper" ,
"irritable-paca" ,
"irritating-chameleon" ,
"irritating-dabchick" ,
"irritating-skunk" ,
"irritating-trumpeter" ,
"jealous-cuis" ,
"jobless-stilt" ,
"jolly-kingfisher" ,
"jolly-nighthawk" ,
"joyous-giraffe" ,
"joyous-sifaka" ,
"judicious-ostrich" ,
"jumbled-quoll" ,
"keen-dolphin" ,
"keen-nyala" ,
"kindhearted-cheetah" ,
"knotty-hedgehog" ,
"knotty-urial" ,
"known-glider" ,
"known-opossum" ,
"lackadaisical-nighthawk" ,
"lacking-polecat" ,
"lame-kingfisher" ,
"lame-lemming" ,
"lamentable-bulbul" ,
"large-baboon" ,
"large-cheetah" ,
"laughable-toucan" ,
"lavish-jaeger" ,
"lavish-pelican" ,
"lazy-puffin" ,
"lean-kookaburra" ,
"left-gulls" ,
"legal-chital" ,
"lethal-mantis" ,
"lethal-numbat" ,
"light-bustard" ,
"light-sloth" ,
"likeable-oryx" ,
"likeable-sheathbill" ,
"limping-vulture" ,
"lively-urial" ,
"livid-legaan" ,
"lonely-wallaby" ,
"longing-boar" ,
"longing-toucan" ,
"loose-stork" ,
"loud-hawk" ,
"loud-lizard" ,
"loud-potoroo" ,
"loutish-paradoxure" ,
"loutish-waxbill" ,
"lovely-alpaca" ,
"lucky-tern" ,
"ludicrous-numbat" ,
"lumpy-guerza" ,
"lumpy-openbill" ,
"lush-baboon" ,
"luxuriant-pie" ,
"lying-capybara" ,
"maddening-bandicoot" ,
"maddening-magpie" ,
"madly-stilt" ,
"magical-bat" ,
"magnificent-jackrabbit" ,
"mammoth-swallow" ,
"mammoth-weaver" ,
"many-turaco" ,
"marked-tinamou" ,
"married-mynah" ,
"marvelous-camel" ,
"massive-mara" ,
"massive-shark" ,
"materialistic-argalis" ,
"materialistic-deer" ,
"materialistic-potoroo" ,
"mature-seal" ,
"measly-parakeet" ,
"medical-flamingo" ,
"medical-phascogale" ,
"melancholy-wildebeest" ,
"mellow-coatimundi" ,
"mellow-wagtail" ,
"melodic-steenbok" ,
"melted-springhare" ,
"merciful-eland" ,
"merciful-guanaco" ,
"mighty-guanaco" ,
"mighty-seal" ,
"miscreant-duiker" ,
"miscreant-langur" ,
"miscreant-mongoose" ,
"miscreant-warthog" ,
"mistaken-blesbok" ,
"mistaken-opossum" ,
"misty-crane" ,
"mixed-bear" ,
"mixed-kangaroo" ,
"modern-adouri" ,
"moldy-zorilla" ,
"moody-badger" ,
"motionless-springbuck" ,
"muddled-dove" ,
"mushy-gazer" ,
"mushy-kongoni" ,
"mushy-seal" ,
"mushy-whale" ,
"naive-caracal" ,
"naive-eagle" ,
"naive-shark" ,
"nappy-fisher" ,
"nappy-pronghorn" ,
"narrow-brocket" ,
"nasty-wombat" ,
"natural-grison" ,
"neighborly-galah" ,
"neighborly-trumpeter" ,
"nervous-siskin" ,
"new-cliffchat" ,
"nifty-bushpig" ,
"nimble-gull" ,
"nimble-sparrow" ,
"nine-badger" ,
"nippy-sifaka" ,
"nippy-tinamou" ,
"nonsensical-constrictor" ,
"nonstop-nilgai" ,
"normal-drongo" ,
"normal-fisher" ,
"noxious-flamingo" ,
"noxious-pademelon" ,
"null-dassie" ,
"numberless-hornbill" ,
"numerous-dabchick" ,
"obedient-gemsbok" ,
"obedient-malleefowl" ,
"obedient-moorhen" ,
"obeisant-gecko" ,
"obeisant-pademelon" ,
"obnoxious-starling" ,
"obsolete-bushbuck" ,
"obsolete-finch" ,
"obsolete-reedbuck" ,
"odd-ibex" ,
"offbeat-goose" ,
"omniscient-tern" ,
"orange-thrasher" ,
"ordinary-brocket" ,
"ossified-sidewinder" ,
"outrageous-dabchick" ,
"outstanding-badger" ,
"outstanding-caribou" ,
"outstanding-starling" ,
"oval-ostrich" ,
"overconfident-owl" ,
"overjoyed-dolphin" ,
"overt-hen" ,
"overt-squirrel" ,
"paltry-hummingbird" ,
"panoramic-kingfisher" ,
"parallel-chital" ,
"parallel-waterbuck" ,
"pastoral-rhea" ,
"pathetic-lynx" ,
"pathetic-serval" ,
"pathetic-trumpeter" ,
"penitent-finch" ,
"penitent-tern" ,
"perfect-paca" ,
"periodic-bandicoot" ,
"periodic-quoll" ,
"permissible-boar" ,
"permissible-springbuck" ,
"perplexed-caracal" ,
"perplexed-glider" ,
"perplexed-hoopoe" ,
"petite-kongoni" ,
"petty-crake" ,
"physical-puma" ,
"pink-dove" ,
"plain-tiger" ,
"pleasant-polecat" ,
"poised-glider" ,
"poised-godwit" ,
"possessive-moorhen" ,
"possible-gazer" ,
"premium-partridge" ,
"present-chimpanzee" ,
"previous-monster" ,
"pricey-anteater" ,
"prickly-cottonmouth" ,
"prickly-numbat" ,
"private-whale" ,
"protective-devil" ,
"psychedelic-bandicoot" ,
"psychedelic-parakeet" ,
"public-bushbuck" ,
"puffy-bushpig" ,
"puffy-platypus" ,
"pungent-lynx" ,
"purple-springhare" ,
"purple-steenbuck" ,
"purring-caracara" ,
"pushy-agouti" ,
"puzzling-salmon" ,
"quaint-salmon" ,
"quarrelsome-duiker" ,
"quarrelsome-tenrec" ,
"questionable-liger" ,
"questionable-springhare" ,
"questionable-thrasher" ,
"quick-bat" ,
"quick-curlew" ,
"quirky-crake" ,
"quixotic-sloth" ,
"ragged-groundhog" ,
"ragged-peacock" ,
"rainy-siskin" ,
"rambunctious-monkey" ,
"rampant-crane" ,
"rare-cottonmouth" ,
"rare-malleefowl" ,
"raspy-bison" ,
"real-phascogale" ,
"reassured-bear" ,
"reassured-thrasher" ,
"rebel-gerenuk" ,
"rebel-meerkat" ,
"receptive-meadowlark" ,
"red-grison" ,
"red-ringtail" ,
"regular-oryx" ,
"relieved-lion" ,
"remarkable-paca" ,
"resolute-drongo" ,
"resolute-kongoni" ,
"responsible-duck" ,
"responsive-argalis" ,
"rhetorical-coot" ,
"rigid-gemsbok" ,
"roasted-egret" ,
"roasted-gazelle" ,
"roomy-sidewinder" ,
"rotten-gazelle" ,
"rotund-otter" ,
"rough-rat" ,
"round-ox" ,
"royal-bushpig" ,
"rural-tinamou" ,
"sable-goldeneye" ,
"sad-gnu" ,
"sad-hen" ,
"safe-genoveva" ,
"salty-deer" ,
"salty-kingfisher" ,
"same-gerenuk" ,
"same-grison" ,
"same-lynx" ,
"satisfying-sloth" ,
"satisfying-yak" ,
"savory-penguin" ,
"scant-dabchick" ,
"scared-phalarope" ,
"scientific-oribi" ,
"scrawny-currasow" ,
"scrawny-starfish" ,
"secret-bleu" ,
"secret-capybara" ,
"secretive-galah" ,
"sedate-dove" ,
"selfish-emu" ,
"separate-marten" ,
"shaggy-sheathbill" ,
"shaky-vulture" ,
"shallow-seal" ,
"sharp-bleu" ,
"sharp-hawk-eagle" ,
"shiny-onager" ,
"shivering-parrot" ,
"shivering-tarantula" ,
"short-nyala" ,
"short-wallaby" ,
"shrill-corella" ,
"shy-anteater" ,
"shy-lizard" ,
"shy-serval" ,
"sick-sidewinder" ,
"silky-caribou" ,
"silky-magpie" ,
"silly-albatross" ,
"silly-tortoise" ,
"simplistic-falcon" ,
"skillful-paradoxure" ,
"skillful-sloth" ,
"skinny-gerbil" ,
"skinny-huron" ,
"slow-cobra" ,
"slow-drongo" ,
"smarmy-argalis" ,
"smart-rat" ,
"smelly-rhinoceros" ,
"smiling-gerenuk" ,
"smoggy-tanager" ,
"smug-boa" ,
"smug-quoll" ,
"smug-weaver" ,
"sneaky-goose" ,
"snobbish-goat" ,
"snotty-marten" ,
"soft-bee-eater" ,
"soft-turaco" ,
"soggy-python" ,
"sordid-wallaby" ,
"sour-goat" ,
"spiffy-crocodile" ,
"spiffy-plover" ,
"spotty-cat" ,
"spotty-gemsbok" ,
"squalid-koala" ,
"squalid-wagtail" ,
"square-python" ,
"squealing-wagtail" ,
"squeamish-suricate" ,
"staking-jackal" ,
"stale-chameleon" ,
"stale-curlew" ,
"standing-alpaca" ,
"statuesque-gerenuk" ,
"steady-bison" ,
"steady-gulls" ,
"steady-parakeet" ,
"sticky-egret" ,
"sticky-teal" ,
"stingy-ostrich" ,
"stingy-pademelon" ,
"stout-boa" ,
"stout-caracal" ,
"straight-polecat" ,
"stupendous-goose" ,
"sturdy-bleu" ,
"sturdy-eland" ,
"subdued-hawk-eagle" ,
"subsequent-jaguarundi" ,
"subsequent-turtle" ,
"substantial-tamandua" ,
"successful-cow" ,
"successful-pintail" ,
"succulent-whale" ,
"sulky-duiker" ,
"sulky-puma" ,
"sulky-trotter" ,
"super-jaguarundi" ,
"superior-kookaburra" ,
"superior-spider" ,
"swanky-hedgehog" ,
"swanky-sambar" ,
"sweet-hornbill" ,
"sweltering-bettong" ,
"sweltering-genoveva" ,
"taboo-grenadier" ,
"tacit-bushbaby" ,
"tacit-echidna" ,
"tacky-onager" ,
"talented-baboon" ,
"talented-sambar" ,
"tall-boubou" ,
"tall-gerenuk" ,
"tangy-mantis" ,
"tangy-paca" ,
"tasteful-elk" ,
"tasteful-ovenbird" ,
"tasteful-woylie" ,
"tasteless-serval" ,
"tedious-caracara" ,
"teeny-pheasant" ,
"telling-numbat" ,
"temporary-hare" ,
"tenuous-skink" ,
"terrible-dabchick" ,
"terrific-crake" ,
"terrific-thrasher" ,
"tested-serval" ,
"testy-raccoon" ,
"thankful-baboon" ,
"thin-hyena" ,
"thinkable-snake" ,
"thinkable-tanager" ,
"thirsty-steenbok" ,
"thoughtless-gnu" ,
"three-fowl" ,
"three-woodchuck" ,
"tidy-hyrax" ,
"tidy-puku" ,
"tight-rhinoceros" ,
"tight-trumpeter" ,
"tight-wallaroo" ,
"tightfisted-coyote" ,
"tightfisted-waterbuck" ,
"timely-bird" ,
"timely-frog" ,
"tiny-chameleon" ,
"tiny-ocelot" ,
"tired-bleu" ,
"toothsome-pintail" ,
"torpid-numbat" ,
"tough-buffalo" ,
"tough-camel" ,
"tranquil-deer" ,
"tranquil-tamandua" ,
"trite-osprey" ,
"true-gnu" ,
"two-starling" ,
"typical-genoveva" ,
"typical-mynah" ,
"ubiquitous-dabchick" ,
"ubiquitous-pronghorn" ,
"ubiquitous-urial" ,
"ugly-bat" ,
"ultra-swan" ,
"unaccountable-nighthawk" ,
"uncovered-monster" ,
"unequaled-mynah" ,
"unhealthy-weaver" ,
"unique-lark" ,
"unkempt-chameleon" ,
"unknown-crow" ,
"unknown-weaver" ,
"unruly-chital" ,
"unsightly-margay" ,
"unsightly-pademelon" ,
"unsuitable-topi" ,
"unusual-drongo" ,
"unusual-ovenbird" ,
"unusual-woodpecker" ,
"unwieldy-pronghorn" ,
"unwritten-grouse" ,
"upbeat-crane" ,
"uptight-lorikeet" ,
"useful-bushpig" ,
"useful-sifaka" ,
"useful-tiger" ,
"useless-raven" ,
"utter-ant" ,
"utter-swallow" ,
"vacuous-sifaka" ,
"vagabond-suricate" ,
"vague-goldeneye" ,
"various-monitor" ,
"vast-alligator" ,
"vast-quoll" ,
"vengeful-butterfly" ,
"vengeful-springhare" ,
"vengeful-wildebeest" ,
"venomous-hawk" ,
"violent-paca" ,
"violet-blesbok" ,
"violet-gulls" ,
"violet-phascogale" ,
"violet-spoonbill" ,
"violet-stilt" ,
"virtuous-armadillo" ,
"virtuous-tanager" ,
"wacky-kudu" ,
"wacky-turtle" ,
"waiting-barbet" ,
"wakeful-stilt" ,
"warlike-jaeger" ,
"wary-brocket" ,
"weak-orca" ,
"weary-dragon" ,
"wet-hippopotamus" ,
"whimsical-numbat" ,
"whimsical-trotter" ,
"white-skua" ,
"whole-bushbaby" ,
"whole-potoroo" ,
"wholesale-eagle" ,
"wholesale-lourie" ,
"whopping-steenbok" ,
"wicked-chimpanzee" ,
"wiggly-fox" ,
"wiggly-jacana" ,
"wild-giraffe" ,
"wiry-hornbill" ,
"wise-woodchuck" ,
"wistful-bustard" ,
"wistful-creeper" ,
"witty-parakeet" ,
"witty-trumpeter" ,
"wobbly-sparrow" ,
"woebegone-antelope" ,
"woebegone-rattlesnake" ,
"wonderful-birds" ,
"wonderful-hartebeest" ,
"workable-avocet" ,
"worried-lemming" ,
"worrisome-bison" ,
"worrisome-bushbuck" ,
"worrisome-wombat" ,
"worthless-gonolek" ,
"worthless-steenbok" ,
"wrong-alligator" ,
"wrong-alpaca" ,
"wry-gorilla" ,
"wry-lemming" ,
"yellow-grenadier" ,
"zesty-creeper" ,
"zesty-impala" ,
"zesty-sambar" ,
"zesty-suricate" ,
"zippy-macaque" ,
"zonked-gazelle" ,
"zonked-stilt"
]

module.exports = animalChannels
