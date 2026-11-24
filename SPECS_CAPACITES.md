# WARBLAST — Spécifications officielles des capacités

Statut : une capacité est « validée » seulement après confirmation d'Alou. Ne pas la modifier sans son accord.

## EAU (fruit bleu) — spécification officielle
Famille : contrôle / repoussement. Commune aux 5 niveaux : 5 utilisations, recharge indépendante, direction donnée par le stick d'attaque, déclenchement automatique au relâchement, vrais dégâts, vraie poussée, collisions avec les murs.

| Niv. | Apparence | Animation | Comportement | Effets |
|---|---|---|---|---|
| 1 | Une vague d'eau bleue à crête blanche | Elle avance en s'élargissant puis s'estompe | Une vague dans la direction visée | Dégâts 17, poussée modérée, touche chaque ennemi une fois |
| 2 | Deux vagues | La deuxième part dès que la première est finie, sans nouvelle action | Deux vagues successives, la 2e plus longue et plus large | Dégâts 2 x 20, la 2e pousse plus loin |
| 3 | Trois vagues | Enchaînement automatique des 3 vagues | Trois vagues successives, la 3e la plus puissante | Dégâts 3 x 23, la 3e pousse le plus fort (x1,25) |
| 4 | Une main d'eau géante sort du sol sous UN seul adversaire ciblé (le plus proche dans la direction visée, portée 340 px) | Montée, fermeture des doigts, soulèvement (58 px), lancer, puis la main s'enfonce et disparaît | Attrape exactement un ennemi, l'étourdit, le projette loin (poussée 2600) | Dégâts 80, étourdissement ~1 s |
| 5 | Rayon d'action visible autour du joueur (260 px) et plusieurs mains d'eau | Toutes les mains sortent en même temps, attrapent, soulèvent, lancent, s'estompent | Chaque ennemi dans le rayon (10 max) est attrapé par sa propre main | Dégâts 55 par ennemi, étourdissement, projection |

Notes techniques : code dans `evolve.js` (bloc EAU), fx `tide`, liste `G.hands`, `WB.updateHands`, `WB.drawHands`. Le silence de l'ancienne version a été retiré (hors spécification). Aucune couche réseau n'existe dans le jeu : la synchronisation multijoueur n'a pas pu être testée.

## FEU (fruit piment) — spécification officielle
Commune : 5 utilisations, brûlure avec fumée noire et dégâts continus jusqu'à l'extinction, appui direct = ciblage automatique de l'adversaire le plus proche.

| Niv. | Apparence | Comportement | Effets |
|---|---|---|---|
| 1 | Une boule de feu (flammes jaunes, orange, rouges) | Une boule vers la cible | Dégâts 13 + brûlure |
| 2 | Deux boules de feu | Lancées ensemble, légèrement écartées | 2 x 16 + brûlure |
| 3 | Rayon de feu continu | 1,1 s, trajectoire fixée au tir, portée 340 px | 5 par impulsion (0,1 s) + brûlure |
| 4 | Deux rayons de feu | 1,3 s, deux trajectoires voisines | 5 par impulsion et par rayon + brûlure |
| 5 | Lance-flammes : masse de flammes en continu | 2,4 s, portée 390 px, cône large, suit doucement l'ennemi le plus proche, touche plusieurs cibles | 6 par impulsion (0,12 s) + brûlure ; laisse des flammes au sol (3,6 s) qui infligent 2 + petite brûlure toutes les 0,3 s |

Un seul jet de feu à la fois par lanceur (pas de charge perdue pendant un jet).

## APPUI DIRECT
Un appui sur une capacité de l'analogue (ou sur l'analogue) la déclenche aussitôt sur l'adversaire le plus proche, sans bouger l'analogue. Sans adversaire à portée : rien n'est consommé (sauf bouclier et invisibilité, utilisables sans cible). Pousser l'analogue reste possible pour viser à la main.

## FUSION (niveau 7 et plus)
- Bouton FUSIONNER (au-dessus de l'analogue) si au moins 2 capacités y sont placées ; DÉFUSIONNER pour les séparer. Capacités non modifiables pendant la fusion.
- Un seul disque de fusion : niveau commun = moyenne des niveaux arrondie au supérieur (max 5), plus de niveaux indépendants.
- Un tir fusionné consomme 1 charge par capacité, les enchaîne toutes les 0,6 s sur les adversaires les plus proches (un différent à chaque fois si possible), puis une attaque combinée finale (zone 120 + 12 x n px, dégâts 14 + 9 x n, poussée).
- Recharge de fusion : 7 s + 2,5 s par capacité (12 s pour 2), bien supérieure aux recharges normales ; le disque affiche le compte à rebours.
- Les capacités reviennent individuelles à la défusion, avec leurs charges propres.

## VENT (fruit poire) — spécification officielle
Dégâts (14 + 4 x niveau) et étourdissement (1 + 0,15 x niveau) d'origine conservés. Portée niv.1 = 270 px.

| Niv. | Comportement | Portée |
|---|---|---|
| 1 | Un souffle vers l'ennemi le plus proche (ou celui dans la direction visée) ; un seul ennemi est repoussé | 270 |
| 2 | Onde à 360° simultanée, tous les ennemis du rayon sont repoussés | 540 (exactement 2 x niv.1) |
| 3 | Un tourbillon visible : tourne autour du joueur en s'éloignant en spirale (3,6 s). Capture 2 personnages au maximum | 340 |
| 4 | Deux tourbillons qui tournent autour du joueur et l'accompagnent 6 s. Chacun capture 2 personnages au plus ; en capturant, il quitte le joueur et emporte sa prise | 260 |
| 5 | Onde 360° immédiate, puis (0,35 s après) 4 tourbillons : 2 défensifs (orbite, 8 s, partent avec leur prise) et 2 offensifs (7 s, poursuivent les adversaires sur la carte) | 540 |

Capture : le personnage est étourdi (aucune action), soulevé et entraîné 0,9 s, puis lancé violemment à l'opposé du lanceur avec les dégâts du vent. Une cible relâchée est immunisée 1,4 s contre une nouvelle capture. Les tourbillons disparaissent si leur propriétaire meurt.

## RAYON D'ACTION (toutes capacités)
Un cercle à la portée de chaque capacité prête placée dans l'analogue est dessiné autour du joueur ; il s'intensifie quand un ennemi y entre. Il est dessiné uniquement pour le joueur local, jamais pour les autres.

## FOURCHE (ancienne « Faux », fruit ananas) — spécification officielle
Nom affiché : Fourche (identifiant interne `scythe` inchangé). Arme : longue fourche du diable noire à lueur violette, trois dents, anneaux violets, particules violettes ; toujours dessinée pendant l'attaque. Dégâts directs 24 + 5 x niveau (valeurs d'origine). 5 utilisations puis recharge. Une seule attaque de fourche à la fois (pas de charge perdue).

| Niv. | Arme | Mouvement | Effets |
|---|---|---|---|
| 1 | Une fourche | S'allonge brusquement et balaie 120° devant, puis revient | Portée 200 px (110 avant) |
| 2 | Deux fourches | Partent de deux côtés opposés et se croisent devant en 0,2 s, frappent simultanément | Portée 200, 2 coups par ennemi |
| 3 | Une grande fourche (x1,55) | Même balayage 120°, portée 200 | Poison dégressif (60 sur 5 s, fort au début) ; dégâts reçus divisés par 2 tant que le niveau 3 est équipé |
| 4 | Deux grandes fourches | Se croisent comme au niveau 2 | Poison dégressif plus fort (100 sur 5,5 s), 2 coups par ennemi |
| 5 | Très grande fourche avec petite tête de mort | Balayage de 180° devant puis 180° derrière (une seule activation) | Portée 180 px ; poison constant de 4 PV/s par petits paliers, jusqu'à la mort ou un soin (tout gain de PV l'arrête) ; recharge 9 s (5 s aux niveaux 1 à 4) |

Notes : le poison utilise le système de dégâts sur la durée existant (dégressif pour N3-N4, constant pour N5). Correction de bug au passage : les dégâts sur la durée (brûlure, poison) ne s'appliquaient pas aux personnages qui n'avaient jamais eu de bouclier (condition `st.shield <= 0` fausse quand la valeur n'existe pas) ; corrigé dans game.js.

## GLACE (fruit myrtille givrée) — spécification officielle
Dégâts et gel ajustés pour l'équilibrage. Recharge après 5 utilisations : 7 s (niv.1 à 3), 8 s (niv.4), 10 s (niv.5).

| Niv. | Comportement | Portée | Effets |
|---|---|---|---|
| 1 | Zone autour du joueur pendant 3,2 s ; l'ennemi le plus proche qui y entre est gelé. Un seul gelé à la fois (le suivant peut l'être après la fin du gel) | 170 | 20 dégâts, gel 1,4 s |
| 2 | Même zone : tous les ennemis qui y entrent sont gelés ensemble | 190 | 24 dégâts, gel 1,7 s |
| 3 | Zone ; quand un ennemi y entre, une trajectoire de piques surgit du sol depuis le joueur et poursuit la cible jusqu'à l'impact (une cible par lancer) | 210 | 34 dégâts + gel 1,7 s à l'impact |
| 4 | 4 cercles de piques (rayons 70, 130, 190, 250) sortent l'un après l'autre à 360°, s'enfoncent puis laissent place au suivant ; aucune poursuite | 260 | 14 dégâts par cercle touché (jusqu'à 4 fois), ralentissement 55 % pendant 2,2 s, jamais de gel |
| 5 | Piège posé à l'endroit visé (ou devant le joueur, même sans ennemi) : grande sphère transparente à flocons, rayon 120 px, armée 10 s. L'ennemi qui y entre est ralenti progressivement (jusqu'à 95 %) puis gelé après 1,6 s de présence ; gel de 1,8 s ; juste avant la fin du gel, piques sur toute la surface | 300 (distance de pose) | 60 dégâts aux ennemis gelés, ils sont libérés, la zone disparaît ; un ennemi qui sort à temps n'est pas gelé |

Choix d'équilibrage : un seul gel par ennemi et par zone, pas de gel pendant le niveau 4, explosion du niveau 5 limitée à 60 dégâts (moins du quart des PV d'un joueur de niveau 1), gel limité à 1,8 s, ennemis libres de sortir pendant les 1,6 s de ralentissement.

## TROU NOIR (niveaux 1 à 5) — en attente de validation

- Charges : 2 seulement pour le trou noir (les autres capacités gardent 5). Recharge à 0 charge : 18 s (niv. 1-4), 26 s (niv. 5).
- Niv. 1 : portée 280, aspire en 8 s max, absorbe 1 ennemi (le boss perd 35 % de sa vie au lieu d'être tué).
- Niv. 2 : absorbe 2 ennemis, durée max 20 s. Niv. 3 : 3 ennemis. Niv. 4 : 4 ennemis.
- Niv. 1-4 : le trou reste en place, attire les ennemis (420 px/s, boss 160), absorbe ceux qui touchent le cœur, se ferme (0,35 s) quand la capacité est atteinte ou le temps écoulé. Les points affichent la capacité restante.
- Niv. 5 : trou de rayon 150 qui suit le lanceur pendant 4 s, absorbe instantanément tout ennemi dans le rayon, anneau de temps visible. Un seul trou niv. 5 à la fois.
- L'absorption ignore bouclier et invulnérabilité de capacité.
- Tests : t83 (19/19), régressions t60 40/40, t72 15/15, t70/t74/t79/t81 sans erreur JS. Non testé : téléphone réel, multijoueur.

## MUR (TERRE), niveaux 1 à 5 — en attente de validation

Niveaux 1 à 3 : le mur est formé de blocs de terre (le moteur gère les murs comme des rectangles) qui partagent une même résistance. Le mur n'apparaît jamais au hasard : il est placé selon la direction de l'ennemi le plus proche, ou de la visée s'il n'y en a aucun.
- Niv. 1 : une ligne droite de 8 blocs perpendiculaire à la direction de l'ennemi, posée entre le joueur et lui (72 px devant le joueur). Résistance 90, durée 14 s. L'ennemi qui fonce dessus subit 16 dégâts de collision (recommence après 0,9 s). Un ennemi qui pousse contre le mur l'use (8 pv/s).
- Niv. 2 : vrai demi-cercle (9 blocs de 44 px, rayon 115, ±90° côté ennemi). Résistance 280, durée 16 s. Collision : 20 dégâts + étourdissement 0,9 s. Plusieurs ennemis bloqués en même temps.
- Niv. 3 : demi-cercle de 11 blocs de 48 px, rayon 135, avec épines. Deux résistances distinctes : chaque épine a 50 pv, le mur 420 pv. Tant qu'il reste une épine, le mur ne perd rien ; une fois toutes les épines détruites, le mur encaisse. Contact avec une épine : +24 dégâts, ou 14 sans collision frontale.
- Niv. 4 : plus de mur. 1 grosse météorite (rayon 105, 75 dégâts, projection, étourdissement 0,9 s) et 4 petites (rayon 62, 28 dégâts) sur l'ennemi le plus proche (position anticipée de 0,35 s). Avertissement au sol, cratères. Sans ennemi à portée, la capacité ne se lance pas. Portée 340.
- Niv. 5 : se déclenche seule quand un ennemi entre à moins de 190 px (une charge consommée). Des blocs de terre sortent du sol et se referment en 0,7 s sur le personnage (protégé et immobile), puis à 1,15 s 26 épines partent dans toutes les directions : 95 dégâts, projection forte et étourdissement 0,6 s à tous les ennemis dans 235 px. La boule disparaît à 1,9 s. Pas de redéclenchement automatique pendant 6 s ensuite. Recharge 16 s après 5 utilisations.
- Recharges : niv. 1-3 : 8 s, niv. 4 : 10 s.
- Tests : t85 (20 vérifications, 3 passages à 20/20, les autres passages perdent 1 à 2 vérifications à cause du joueur qui dérive dans le test) ; régressions t60, t72, t83, t70, t74, t79, t81 sans régression. Non testé : téléphone réel, multijoueur, murs contre un terrain accidenté.

## BOUCLIER, niveaux 1 à 5 — en attente de validation

Le bouclier n'est plus une invulnérabilité : il a sa propre résistance, intercepte les attaques selon leur direction et ne protège que dans les cas prévus.
- Tous niveaux : actif 10 s au maximum, puis disparition. La recharge de 5 s commence dès qu'il disparaît (fin du temps, détruit, ou énergie libérée). Pas de réactivation pendant l'activation ni pendant la recharge. Une seule utilisation avant recharge. Le temps restant s'affiche sous le personnage, et le compteur de la capacité indique le temps avant réutilisation (10 s restantes + 5 s).
- Niv. 1 : arc frontal (±75°), 130 pv. Bloque ce qui vient de face ; dos et côtés non protégés. Seul le lanceur est protégé, même en équipe.
- Niv. 2 : 4 panneaux qui tournent autour du personnage (60 pv). Chaque panneau bloque un impact puis disparaît. Entre deux panneaux, une attaque peut passer. Quand les 4 sont détruits, le bouclier disparaît. Seul le lanceur est protégé.
- Niv. 3 : arc frontal miroir, 180 pv. Renvoie vers leur lanceur les projectiles renvoyables : boules de feu, tirs de tourelle, pierres de golem, toiles d'araignée. Les attaques au corps-à-corps sont bloquées sans être renvoyées. Parade synchronisée : un projectile renvoyé dans les 0,4 premières secondes fait deux fois plus de dégâts. Les lances et les attaques spéciales ne sont pas renvoyées. Le renvoi coûte 22 pv au bouclier.
- Niv. 4 : arc frontal, 220 pv. Les dégâts absorbés remplissent une jauge limitée à 100. Le joueur libère l'explosion avec le bouton LIBÉRER ou en touchant à nouveau la capacité : 25 + 0,9 × jauge dégâts, rayon 150, repousse. Le bouclier disparaît ensuite et la recharge de 5 s commence. Bots : explosion automatique quand la jauge dépasse 60 % et qu'un ennemi est proche.
- Niv. 5 : 6 panneaux de 90 pv qui recouvrent tout le cercle (blocage de toutes les directions), renvoi, absorption (jauge maximale 180) et explosion géante : 40 + jauge dégâts, rayon 240, forte repousse, étourdissement 0,6 s. En équipe seulement : zone de 150 px, les coéquipiers dedans sont couverts par les panneaux, et l'énergie absorbée va à la réserve du lanceur. En solo, aucun allié.
- Effets des attaques sur le bouclier : le feu continu et le poison déjà posés (dégâts dans le temps) passent, les attaques de zone sans source et les dégâts environnementaux aussi. Le trou noir n'est pas bloqué.
- Annulation (capacité Annulation) : retire le bouclier.
- Tests : t89 (31 vérifications, 31/31 trois fois) pour les cinq niveaux en solo et en équipe ; régressions t60 40/40, t72 15/15, t83 19/19, t70/t74/t79/t81 sans erreur JS ; t85 a une vérification instable connue.
- Non testé : téléphone réel, multijoueur réseau, combat prolongé contre les bots avec bouclier.

## TÉLÉPORTATION, niveaux 1 à 5 — en attente de validation

Cette spécification remplace l'ancienne téléportation (balise + ennemi téléporté). La capacité ne déplace plus jamais un autre personnage.
- Tous niveaux : fenêtre d'activation de 10 s, puis recharge de 5 s dès la fin de la capacité (fin normale, toutes les téléportations utilisées, ou onde lancée). Une seule utilisation avant recharge ; pas de réactivation pendant la fenêtre ni la recharge. Les déplacements déjà faits sont conservés à l'expiration. Temps restant et nombre de téléportations restantes affichés sous le personnage.
- Téléportation instantanée (pas de déplacement entre départ et arrivée), avec colonne de lumière violette et anneaux au départ et à l'arrivée.
- Vérification de chaque destination : dans la carte, ni mur ni eau, pas sur un autre personnage, et aucun mur ni obstacle (y compris les murs de capacités) sur le trajet. La téléportation directionnelle retient le point valide le plus éloigné, sinon elle échoue. Une téléportation impossible ne déplace rien, ne consomme aucun déplacement et ne déclenche pas la recharge.
- Niv. 1 : une téléportation de 240 px maximum dans la direction choisie (stick, ou direction du regard avec un simple appui). Une seule par activation, puis recharge de 5 s.
- Niv. 2 : derrière l'adversaire visé (le plus proche, à moins de 380 px). Position calculée à l'opposé de l'approche, avec essais de côtés si elle est occupée ; le personnage se retrouve orienté vers l'adversaire. Sans adversaire ou sans position valide, rien ne se passe. Une seule par activation.
- Niv. 3 : trois téléportations par activation, chacune sur une nouvelle commande (une par poussée du stick, 0,3 s minimum entre deux). Direction libre à chaque fois ; avec un adversaire visé, arrivée derrière lui. La fenêtre se ferme après la 3e.
- Niv. 4 : comme le niveau 3 (trois téléportations) et chaque téléportation réussie laisse une image fantôme à l'ancien emplacement exact, visible 4,5 s puis qui s'estompe. Le fantôme est purement visuel : hors de la liste des combattants, sans collision, ni contrôle, ni attaque, ni dégâts, et les adversaires ne peuvent pas le viser avec leurs capacités. Les bots le prennent parfois pour cible.
- Niv. 5 : cinq téléportations avec une image fantôme à chaque fois. Après au moins une téléportation, le bouton ONDE FINALE (ou un appui quand les cinq sont utilisées) déclenche une onde au point d'arrivée : 70 dégâts, repousse et étourdissement 0,4 s dans 210 px, adversaires seulement, une seule fois, puis la capacité se termine. Jamais déclenchée automatiquement, même si le temps expire.
- Équipe : mêmes règles. Les fantômes et l'onde ne concernent que les adversaires, jamais les alliés.
- Choix à valider : le niveau 4 garde 3 téléportations (la spécification ne le précise pas) ; aux niveaux 3 à 5 un appui simple avec un adversaire à portée te place derrière lui.
- Tests : t91 (32 vérifications, dont 60 téléportations sur le terrain réel de l'arène sans aucune destination invalide ni mur traversé), régressions t60 40/40, t72 15/15, t83 19/19, t85 20/20, t89 31/31, t70/t74/t79/t81 sans erreur JS. Non testé : téléphone réel, multijoueur réseau, combat prolongé contre des bots qui visent les fantômes.

## VITESSE, niveaux 1 à 5 — en attente de validation

Capacité offensive : elle blesse dès le niveau 1. Elle réutilise la charge et les traînées de vitesse déjà présentes dans le jeu (la charge passe par le mouvement de ruée existant à 1700 px/s), avec en plus des lignes de vitesse, des étoiles d'impact et des ondes. Chaque niveau a 5 charges ; une activation consomme une charge, quel que soit le nombre de frappes. Pas de seconde activation pendant la séquence ; la séquence s'interrompt si le lanceur est étourdi, gelé ou meurt.
- Ciblage automatique dans toutes les directions autour du lanceur, rayon 290 (niveaux 1 à 3) et 330 (niveaux 4 et 5). Sans adversaire à portée, rien ne part et aucune charge n'est consommée. Les alliés ne sont jamais ciblés.
- Niv. 1 : charge sur le plus proche, un seul adversaire, 24 dégâts, léger recul.
- Niv. 2 : charge renforcée, 42 dégâts, recul fort (environ 2 fois celui du niveau 1).
- Niv. 3 : 40 dégâts plus une onde de choc au point d'impact (rayon 135, 20 dégâts supplémentaires à tous les adversaires proches, y compris la cible, et repousse), avec une propagation visible.
- Niv. 4 : 5 frappes de 50 dégâts en une seule activation. Chaque frappe vise de préférence un adversaire différent du précédent, en répartissant les frappes ; si un seul est à portée, les frappes se concentrent sur lui. Recul léger (110) pour que les cibles restent à portée. Une cible morte en route est remplacée. 5 échecs de charge (obstacle) au maximum, puis la séquence se termine : pas de boucle infinie.
- Niv. 5 : charge, 60 dégâts à l'impact, puis rafale de poings pendant 2,0 s (7 poings visibles, un coup de 11 toutes les 0,07 s, environ 300 dégâts par adversaire en tout). L'adversaire est étourdi pendant toute la rafale puis libéré. Ensuite le lanceur fonce sur un deuxième adversaire différent et refait la même rafale ; les deux séquences ne se chevauchent jamais. Sans deuxième adversaire, la séquence se termine normalement.
- Total par activation : niveau 4 : 250 ; niveau 5 : environ 740 sur deux adversaires.
- Tests : t93 (17 vérifications, 17/17 quatre fois) ; régressions t60 40/40, t83 19/19, t85 20/20, t89 31/31, t91 32/32, t70/t74/t81 sans erreur JS ; t72 (fusion) a des vérifications instables liées au hasard des bots, 15/15 trois fois sur quatre. Test avec bots libres pendant 12 s sans erreur JS. Non testé : téléphone réel, multijoueur réseau.
