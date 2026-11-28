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

## INVISIBILITÉ, niveaux 1 à 5, et bombes normales — en attente de validation

Bombes normales (modification générale) : chaque combattant démarre avec 10 bombes au lieu de 5. Elles ne se régénèrent jamais, y compris avec la capacité Annulation (sa régénération des bombes a été retirée pour respecter la règle). La barre du HUD affiche 10 icônes.
Bombes spéciales de l'Invisibilité : système séparé, illimité, qui ne touche jamais au stock de bombes normales (vérifié à chaque niveau : le compteur reste à 10).
Cette spécification remplace l'ancienne Invisibilité (invisibilité longue, silence, esquive, nova). Charges : 2 utilisations puis 9 s de recharge aux niveaux 1 à 4 ; niveau 5 : fenêtre de 10 s puis 3 s de recharge.
- Niv. 1 Frappe invisible : cible = l'adversaire visé, sinon le plus proche à moins de 420 px (rien ne part et aucune charge n'est consommée sans cible). Le personnage disparaît 0,6 s, se téléporte derrière lui (position vérifiée : ni mur, ni eau, ni personnage), dépose une bombe qui reste attachée et le suit. Elle explose une seule fois : soit quand le porteur utilise une capacité (60 dégâts au porteur seul), soit quand un autre adversaire l'attaque (60 au porteur, 24 à l'attaquant). Un poseur ou son équipe qui attaque le porteur ne déclenche rien, les dégâts sur la durée non plus. La bombe est retirée si le porteur meurt, et se désamorce seule au bout de 25 s.
- Niv. 2 Attaque furtive multiple : tous les adversaires à moins de 520 px. Séquence automatique du plus proche au suivant le plus proche : téléportation derrière chacun toutes les 0,32 s, une bombe sur chacun, aucune explosion pendant la pose, personnage invisible, invulnérable et sans autre action. Quand la dernière est posée, il redevient visible et toutes explosent au même instant. Direct 55 par porteur ; indirect 20 par explosion voisine (rayon 150) vers les porteurs proches, un seul appel de dégâts par victime, indirect cumulé plafonné à 80 % du direct. Une cible éliminée en cours de route est sautée ; si le lanceur meurt, les bombes posées explosent.
- Niv. 3 Bombe géante : rayon de recherche 700 px. Le système choisit le point qui regroupe le plus d'adversaires (rayon de 180 px) et vise le centre du groupe, jamais un endroit vide s'il y a des adversaires. La bombe grossit au-dessus du lanceur (0,45 s, il est invisible), puis voyage (au moins 0,7 s) avant d'exploser. Rayon 200, dégâts de 100 au centre à 30 au bord, recul décroissant. Taille visuelle environ 3 fois celle d'une bombe normale, cercle d'impact affiché, onde de choc et secousse d'écran.
- Niv. 4 : bombe géante identique, plus la double vie. Une copie (capital de vie égal aux PV du joueur au lancement) absorbe tous les dégâts à la place du vrai personnage, avec sa propre barre et un halo cyan. Quand elle est détruite, le vrai personnage est intact, avec 0,5 s de protection, et l'excédent de dégâts n'est pas reporté. Une seule copie à la fois, pas de renouvellement tant qu'elle existe, et elle disparaît d'elle-même après 12 s.
- Niv. 5 Domaine des ténèbres : bulle noire de rayon 250 px autour du joueur, qui le suit, 10 s exactement puis 3 s de recharge. Les adversaires dans la bulle ne peuvent plus le verrouiller (ciblage automatique et bots) et leurs attaques passent à côté : dégâts d'attaque, projectiles et zones d'attaque lancés depuis l'intérieur. Les attaques lancées depuis l'extérieur de la bulle avec une portée suffisante touchent normalement. Le joueur et les adversaires restent visibles. Pendant la bulle, le bouton de bombe lance une bombe spéciale illimitée (rayon 95, 58 dégâts contre rayon 74 et 32 pour une bombe normale) et affiche x∞.
- Équipe : les alliés ne sont jamais ciblés ni touchés par les bombes ni par la double vie.
- Limites connues : à l'intérieur de la bulle, seuls les dégâts, projectiles et zones d'attaque sont ratés ; un effet sans source (ralentissement, recul) appliqué isolément par un ennemi intérieur peut encore passer. La téléportation du niveau 2 n'exige pas de chemin libre entre deux cibles (seule la destination est vérifiée). La copie du niveau 4 est une couche de vie (le joueur continue de contrôler le personnage visible).
- Tests : t95 (60 vérifications couvrant les bombes, chaque niveau séparément, solo et équipe, cible éliminée en cours de séquence, bots niveaux 1 à 5) ; quelques vérifications échouent au hasard dans une exécution complète à cause des bots du test, chacune repasse isolément ; régressions t60, t72, t83, t85, t89, t93 repassent.

## ARAIGNÉE, niveaux 1 à 5 — en attente de validation

Cette spécification remplace l'ancienne Araignée (simple toile qui immobilise). Aux niveaux 1 à 4, chaque activation lance l'attaque du personnage et fait apparaître exactement 3 petites araignées rouges. Sans adversaire à portée (380 px) rien ne part, aucune araignée n'apparaît et la charge n'est pas consommée.
Les petites araignées sont de vraies entités avec leur propre IA : elles se placent autour du lanceur, cherchent l'adversaire le plus proche (420 px), s'en approchent et lancent leurs propres toiles avec une animation de pattes (course) et un gonflement à chaque lancer. Elles durent 9 s et leurs dégâts sont 60 % de ceux du personnage. Les dégâts sont crédités au personnage (éliminations comprises). Plafond de 6 petites araignées vivantes par joueur : une activation de trop retire les plus anciennes, pas de doublon. Elles disparaissent si leur maître meurt.
- Niv. 1 Toile empoisonnée : toile qui s'accroche (4 dégâts à l'impact), poison progressif de 40 sur 4 s et ralentissement de 30 %. Une seule toile empoisonnée par araignée et par cible, la toile ne se cumule pas sur elle-même. Les araignées font de même (1,6 s entre deux toiles).
- Niv. 2 Capture arachnéenne : grosse toile qui enveloppe un adversaire, l'immobilise 3 s, se resserre (dessin) et inflige 70 dégâts continus, de plus en plus forts. Un adversaire déjà enveloppé n'est pas ré-enveloppé. Les araignées cherchent de préférence des cibles encore libres.
- Niv. 3 Multiplication des toiles : 3 à 4 toiles successives (0,18 s d'écart) sur des adversaires différents (la même cible n'est reprise que s'il n'y en a pas assez), chacune avec 10 dégâts, 26 de poison sur 3 s et 45 % de ralentissement. Chaque araignée tire jusqu'à 3 toiles successives sur des cibles différentes.
- Niv. 4 Prison arachnéenne : immense toile de rayon 150 posée sous l'adversaire visé, qui emprisonne tous les adversaires dedans pendant 4 s. Elle se resserre, inflige 90 dégâts continus croissants, puis se déchire : dernière vague de 50 dégâts avec recul. Chaque petite araignée pose jusqu'à 2 zones de rayon 85 (durée 3,2 s) quand elle est assez près de ses cibles, avec la même déchirure finale.
- Niv. 5 Roi des araignées : plus de petites araignées. Une araignée géante (dessinée, avec pattes animées, taille 1,45 fois celle du personnage) apparaît sous lui et il monte dessus pendant 15 s, puis 5 s de recharge. Elle suit les déplacements du joueur. Pendant la montée, chaque appui sur la capacité déclenche l'attaque suivante, avec 1 s entre deux attaques, dans l'ordre : toiles multiples (jusqu'à 5 adversaires enveloppés 2,5 s, 45 dégâts continus), morsures (jusqu'à 3 adversaires, de préférence emprisonnés, l'araignée se précipite derrière chacun : 85 dégâts, 25 % de plus sur un emprisonné), toile géante (rayon 240, 3,5 s, 90 dégâts continus, ralentissement, déchirure finale de 40). Si la prochaine attaque est impossible faute de cible utile, on passe à la suivante. Le nom de l'attaque s'affiche au-dessus de l'araignée.
- Protection du niveau 5 : tant que l'araignée vit, tous les dégâts qui visent le personnage (coups, projectiles, zones, dégâts sur la durée) vont à l'araignée, qui a sa barre de vie (1,6 fois les PV du personnage). Le personnage ne perd rien. Quand elle tombe à 0 il descend, avec toute sa santé (aucun dégât en trop n'est reporté), et redevient vulnérable. Elle disparaît aussi à la fin des 15 s ou si le personnage meurt. Pas de seconde araignée en réactivant : la capacité déclenche les attaques.
- Équipe : alliés jamais touchés, enveloppés ni ciblés.
- Choix à valider : durées, dégâts, plafond de 6 araignées et 60 % de puissance pour les petites araignées sont mes valeurs ; l'araignée géante n'a pas de commande de direction propre (elle est le personnage agrandi, la hitbox grandit avec elle) ; l'ordre des 3 attaques de la monture est automatique (pas de choix de l'attaque).
- Limites : pas de test sur téléphone ni en multijoueur réseau.
- Tests : t97 (41 vérifications, chaque niveau séparément, dégâts réels des araignées vérifiés, protection, équipe, bots niveaux 1 à 5 sur 40 s) ; régressions t60 40/40, t72 15/15, t83 19/19, t89 31/31, t91 32/32, t93 17/17, t95 60/60, t85 19 ou 20 sur 20 (vérification d'épines aléatoire).

## MISE À JOUR : MODE ENTRE AMIS, HERBES, MAISONS, RECHARGE INDIVIDUELLE, CLONAGE EXPLOSIF — en attente de validation

Mode entre amis : aucun sbire, aucun boss, aucune IA qui les remplace (vérifié : 10 combattants, 0 sbire, 0 boss). Pièges, araignées du décor, coffres, objets, créatures et clones invoqués par les capacités restent. Le Wild Game est inchangé (22 combattants dont 10 sbires et 2 boss en ville).

Herbes : zones d'herbes dans les trois arènes (couleurs adaptées : vert clair à fleurs en nature, vert franc en ville, vert-bleu lumineux au donjon). Un combattant dont le corps touche l'herbe est caché des adversaires situés à plus de 110 px (camouflage, pas invisibilité : il voit les autres et bouge normalement, il redevient visible dès qu'il est entièrement sorti). Le ciblage automatique des capacités peut toujours le viser. Les bots et les clones ne le prennent pas pour cible de loin.

Maisons : 10 en ville, 4 en nature, aucune au donjon. 6 x 5 cases, murs pleins, une porte en bas, une cloison avec passage, plancher en bois. Toit qui s'efface quand on entre. À l'intérieur, tout l'extérieur devient noir et seul l'intérieur est visible. Dedans et dehors ne se voient pas et ne se ciblent pas (ciblage automatique compris, dans les deux sens, ainsi que pour les bots et les clones). Chaque maison contient 3 coffres de types différents : soin (vert, rend 60 % des PV), fruits (jaune, 2 fruits dont un mystère), recharge (bleu, restaure toutes les charges, remet les bombes à 10, soigne 25 %). Les coffres reviennent 45 s après ouverture. Les clones ne les ouvrent pas.

Recharge : 5 charges par capacité pour tous les personnages (trou noir 2, bouclier et téléportation 1, invisibilité 2 puis 1 au niveau 5). Chaque charge utilisée lance tout de suite son propre compte à rebours, en parallèle, sans attendre que toutes soient dépensées. Les capacités à fenêtre (téléportation, bouclier, invisibilité 5, araignée 5) gardent leur fonctionnement.

Clonage explosif (nouvelle capacité, fruit : deux pêches jumelles, recharge 10 s x 0,65) :
- Niv. 1 : clone poursuiveur (275 px/s, 70 PV, explose au contact d'un ennemi visible, rayon 110, 60 dégâts, se recible tout seul, disparaît sans exploser au bout de 40 s) et clone caché de secours (invisible et intouchable, placé de préférence dans une maison ou l'herbe loin des ennemis, sinon loin). Seconde chance une fois par activation : si le personnage est tué, l'ennemi marque le kill, le personnage réapparaît chez le clone caché avec 60 % des PV, toutes les charges restaurées et 1,6 s d'invulnérabilité, le clone disparaît.
- Niv. 2 : gros clone absorbeur qui avale le personnage (taille x1,6). Il encaisse tous les dégâts et effets dans une jauge (150), explose à 100 % (rayon 235, 90 dégâts, étourdissement) sans blesser le joueur, qui réapparaît. Si la jauge n'est pas pleine après 12 s, il se dissout (explosion réduite si la jauge dépasse 35 %). Clone de secours caché en plus.
- Niv. 3 : absorbeur (jauge 170) et 5 petits clones autonomes (45 PV). Ils se placent autour du lanceur puis attendent immobiles. Quand un ennemi entre dans leur zone de détection (340 px) ils le poursuivent et explosent au contact (rayon 92, 50 dégâts). Jamais d'explosion dans le vide. Pas de clone caché : à la mort, le personnage renaît sur le petit clone le plus proche encore vivant (une fois), sinon mort normale.
- Niv. 4 : absorbeur (jauge 190) et parasites : un par ennemi qui entre dans la zone de détection (330 px), 4 au maximum. Créature verte très rapide, s'accroche à l'ennemi, n'explose que si cet hôte touche un autre ennemi : l'hôte et l'autre sont blessés (65), les ennemis à proximité aussi.
- Niv. 5 : protecteur qui suit derrière (jauge 280). Quand le personnage est attaqué, il l'avale 1,3 s, prend les coups, le recrache, puis recommence après 1 s. À 100 % : énorme explosion (rayon 340, 150 dégâts). Plus 2 clones parfaits (même apparence, mêmes capacités avec leurs propres charges, hors Clonage, 70 % des PV du lanceur, IA autonome, 60 s) : ils ne ramassent ni coffres, ni vies, ni fruits, ni objets de soin, n'ont pas de réapparition.
- Règles communes : les clones sont des cibles ordinaires pour les ennemis (sauf le clone caché), collisionnent avec le terrain, voient les maisons et les herbes comme les combattants, disparaissent après explosion ou élimination, et tous leurs kills sont crédités au lanceur. Ils ne comptent pas comme des joueurs dans le classement. Une nouvelle activation remplace l'ensemble précédent (pas d'empilement). Un drapeau par clone empêche les doubles explosions. Si le lanceur meurt vraiment, tous ses clones disparaissent.
- Choix à valider : toutes les valeurs ci-dessus sont les miennes ; tant qu'il est avalé le joueur peut bouger et lancer ses capacités ; un seul clone poursuiveur au niveau 1 (le texte disait « un clone poursuiveur » ).
- Limites : pas de test sur téléphone ni en multijoueur réseau. Les attaques qui frappent au travers d'un mur (zones) ne vérifient pas encore la séparation des pièces, seul le ciblage la respecte.
- Tests : t100 (modes, maisons, herbes, coffres), t101 (26 vérifications du Clonage), t102 (70 s de bots lançant la capacité en boucle sur les 3 arènes, aucune erreur), t104 (clones et maisons/herbes). Régressions t60, t83, t85, t89, t91, t93, t97, t72 (certaines attentes adaptées au nouveau modèle de recharge).

Précision du 26/11 : le Clonage explosif remplace le Clown. Le Clown n'est plus proposé (fruits, coffres, bots, guide) ; la liste reste à 20 capacités.

## NÉCROMANCIE, niveaux 1 à 5 — en attente de validation

Remplace l'ancienne Nécromancie (lance qui rend esclave). Chaque niveau garde les mécaniques des précédents : tous les niveaux 1 à 4 invoquent les 5 squelettes, à partir du niveau 2 le chevalier est invoqué aussi, à partir du niveau 3 une flèche de capture part en plus. 5 utilisations, recharge individuelle de chaque charge (10 s, 14 s, 12 s, 14 s, 18 s fois 0,65). La capacité se lance sans cible.
- Squelettes : vrais squelettes dessinés (crâne avec orbites vertes, mâchoire, côtes, colonne, bassin, bras et jambes en os, épée, petit bouclier). Combattants autonomes de type invocation (40 + 8 par niveau PV, 10 + 2 par niveau de dégâts au corps à corps toutes les 0,7 s, 18 s de vie), 15 au maximum par nécromancien (les plus anciens disparaissent).
- Niv. 2 Roi des morts : chevalier géant en armure sombre à cornes, grand bouclier au crâne, très longue épée, cheval spectral avec côtes apparentes et crinière verte. 660 PV, 38 dégâts de zone toutes les 0,9 s sur tous les ennemis proches, 16 s de vie. Reste dans sa zone de protection (340 px autour du maître, laisse de 190 px au repos), ne poursuit jamais au-delà. Se téléporte d'un ennemi à l'autre toutes les 3,2 s et revient toujours près du maître.
- Niv. 3 Vol des âmes : flèche magique à tête chercheuse qui capture un adversaire joueur ou bot (jusqu'à 5 en même temps). Capturé : jamais tué, PV x1,5 et dégâts x1,6, change de camp, défend le nécromancien tout seul. Le nécromancien absorbe 2,5 % de sa vie par demi-seconde (trait vert visible). Après 8 s : libéré, vie normale mais non restaurée (jamais plus que sa vie d'avant moins ce qui a été absorbé), marque de propriété (crâne vert au-dessus de sa tête) pendant 20 s : s'il est éliminé pendant ce temps, le kill revient au nécromancien. Mort pendant la capture : mort normale, pas de squelette.
- Niv. 4 Résurrection macabre : capture de 16 s, marque définitive (kill au nécromancien quel que soit le moment). Mort pendant la capture : le joueur meurt réellement et un guerrier squelette apparaît à l'endroit exact avec les pouvoirs du joueur (copies avec leurs propres charges), 60 % de sa vie normale, 22 s, il se bat sur toute la carte, les ennemis peuvent le tuer, ses kills vont au nécromancien.
- Niv. 5 Temple maudit et roi de la mort : temple noir de style pagode (trois toits relevés, lanternes vertes, porte rouge, fumée noire et énergie violette) posé au-dessus du nécromancien avec une zone circulaire de 340 px, 12 s. Il libère 5 squelettes par seconde (plafond 36 vivants, 10 s de vie, partent attaquer sur toute la carte) et invoque le chevalier juste avant de disparaître (le chevalier reste 16 s). Dans la zone : régénération de 5 % de la vie par seconde et une résurrection à 60 % de vie par temple. Hors zone rien de cela. Transformation du nécromancien pendant 15 s : taille x1,7, masque de mort, cape déchirée qui flotte, faux noire et rouge à tête de mort (propre au roi, différente de la Fourche). Attaques automatiques : coup de faux en zone (170 px, 40 dégâts, recul) toutes les 1,1 s et vague d'énergie sombre à distance (28 dégâts, traverse) toutes les 2,2 s. Un appui sur la capacité pendant la transformation déclenche une attaque tout de suite sans consommer de charge. Un ennemi touché par la faux est possédé 7 s (4 possédés au maximum) : il garde son apparence avec un cercle violet, combat pour le nécromancien sur toute la carte, puis est libéré. Les kills des possédés vont au nécromancien.
- Règles communes : tout se nettoie à la mort réelle du nécromancien (squelettes, temple, transformation). Les squelettes et le chevalier respectent maisons, herbes, équipes. Une nouvelle activation remplace le chevalier précédent.
- Choix à valider : toutes les valeurs chiffrées, la durée du temple (12 s) et de la transformation (15 s), le fait que la faux possède aussi avec chaque coup, la possibilité de recapturer un possédé libéré tant que la transformation dure.
- Limites : pas de test sur téléphone ni en multijoueur réseau ; le test de 70 s avec les bots sur 3 arènes monte à environ 150 invocations simultanées au maximum (plafonnées), sans erreur.
- Tests : t110 (36 vérifications, chaque niveau), t113 (bots niveaux 1 à 5, 3 arènes, 70 s), régressions t60, t72, t83, t89, t91, t93, t97, t100, t101, t104.

## Tourelle évolutive (refonte visuelle + missile niveau 5)

Fichier : `turret.js` (nouveau). Les anciennes tourelles du dragon et de l'invocation restent gérées par `game.js`.

### Niveaux (mécaniques conservées, rien de supprimé)
| Niv | PV | Durée | Portée | Canons | Particularité |
|---|---|---|---|---|---|
| 1 | 120 | 18 s | 300 | 1 | ciblage auto, suivi, précision qui monte avec le temps de verrouillage |
| 2 | 170 | 20 s | 330 | 2 | deux cibles différentes, ou focus (si la plus proche est sous 40 % de PV) |
| 3 | 240 | 22 s | 350 | 2 | projectiles énergétiques, ralentissement 45 % pendant 2 s |
| 4 | 320 | 24 s | 380 | 3 rotatifs | rafales de 6, pause 1,2 s, surchauffe (8 par tir, blocage 3 s à 100) |
| 5 | 560 | 26 s | 420 | 4 | 4 cibles, rafales quadruples, surcharge, confinement 150 px, explosion finale |

Maximum 2 tourelles par joueur (1 au niveau 5).

### Apparences
N1 petite tourelle ronde à un canon. N2 plus grande, deux nacelles. N3 anneaux de distorsion, noyau et bobines. N4 trois canons rotatifs, jauge de chaleur, vapeur. N5 base massive, quatre bras articulés, noyau central, anneau de confinement, lance-missile qui se soulève, jauge de surcharge.

### Missile à tête chercheuse (niveau 5)
- Rayon de détection 640 (canons : 420), avec ligne de vue.
- Cible = adversaire avec le plus de PV actuels. Égalité : premier dans l'ordre de la liste des combattants. Un seul verrou par missile, jamais de changement.
- Projectile réel : départ 190, accélération 330/s jusqu'à 540, virage 3,4 rad/s, durée de poursuite 5 s, explosion à l'impact, au bout des 5 s, sur un mur ou si la cible meurt.
- Dégâts 75 (rayon 95, décroissants), explose aussi sur les tourelles ennemies.
- Recharge propre de 3 s, maximum 3 missiles en vol, les canons ne s'arrêtent jamais.
- Maison : cible entièrement dans une pièce différente de celle du missile = verrou perdu, le missile vole vers le dernier point connu, n'entre pas, et son explosion ne touche pas les cibles de l'autre pièce.
- Herbe : un adversaire caché par les règles de camouflage (hors des 110 px) n'est ni verrouillé ni suivi. Invisibilité, fantôme et saut : même effet.
- Explosion finale de la tourelle N5 (rayon 210, 110 dégâts) à la fin de sa durée ou à sa destruction.
- Animation : le lanceur se lève 0,45 s avant le tir, le missile sort du lanceur, fumée, flamme, anneau rouge d'alerte sur le joueur visé. Son `missile` au lancement.

### Tests réellement passés (Chromium headless, jeu réel)
Structure et fonctions des 5 niveaux, cibles multiples, rafales, surchauffe, surcharge, confinement, explosion finale ; missile : cible au maximum de PV, départage stable, poursuite réelle, impact, fin à 5 s sans dégât, intervalle de 3 s, canons actifs pendant les poursuites ; maison (cible déjà dedans, cible qui y entre pendant la poursuite) ; herbe (cible cachée, cible qui s'y cache en cours de vol) ; mur ; durée de 60 s avec 14 tourelles actives sur les 3 arènes, aucune erreur, 0,3 à 2 ms par mise à jour ; régressions des tests précédents.

### Limites
Pas de test multijoueur réel ni sur téléphone possibles dans cet environnement. Valeurs d'équilibrage à valider en jeu.

## Annulation (aura automatique + bombes évolutives)

Fichiers : `cancel.js` (nouveau), `game.js` (2 lignes : ralentissement et recharge des ennemis dans l'aura), `index.html` (chargement du script). Aucun deuxième analog. Les anciens effets d'Annulation (silence ciblé) sont remplacés.

### Aura (automatique, sans bouton)
Active tant que la capacité est équipée et le porteur vivant. Cercle violet visible par tous, qui suit le porteur. Jamais sur le porteur ni ses coéquipiers. Un ennemi enfermé dans une maison n'est pas touché.
| Niv | Rayon | Dégâts adverses | Capacités adverses | Ralentissement |
|---|---|---|---|---|
| 1 | 135 | /2 | dégâts -50 % en plus, recharge à 50 % | 10 % |
| 2 | 155 | /3 | -70 %, recharge à 65 % | 20 % |
| 3 | 175 | /4 | -85 %, recharge à 80 % | 30 % |
| 4 | 195 | /4 (attaques normales) | annulées | 40 % |
| 5 | 245 | /4 (attaques normales) | annulées | 50 % |
Entrée : effet complet en 0,25 s. Sortie : retour progressif en environ 1,4 s. Pulsation toutes les 1,2 s : 2 à 4 dégâts.

### Bombes (bouton de capacité)
Munitions illimitées (le stock reste 5/5), cadence : 0,9 s, 1,1 s, 1,3 s, 1,5 s, 2,2 s selon le niveau. L'aura reste active. Dégâts : principale / secondaire / finale (rayon).
- N1 bombe simple : 30 (72), explose au sol ou au contact d'un adversaire.
- N2 : 16 (62), 3 secondaires à 14 (56).
- N3 : 14 (60), 4 secondaires à 11 (52), 8 finales à 9 (46). Total 13 explosions.
- N4 : 14 (60), 5 secondaires à 11 (52), 15 finales à 9 (44). Total 21 explosions.
- N5 giga bombe : 3 rebonds puis explosion 42 (125), 5 secondaires qui rebondissent 3 fois, 22 (82), 10 finales qui rebondissent 3 fois, 16 (66). Total 16 explosions, rien après.
Une chaîne ne blesse pas deux fois la même cible dans le même instant (0,12 s). Pas de dégâts au porteur ni aux alliés. Murs et maisons arrêtent ou font rebondir les bombes, une explosion ne traverse pas les murs d'une maison.

### Tests réellement passés (Chromium headless, jeu réel)
Aura sans appui sur le bouton aux 5 niveaux ; porteur et allié jamais affectés ; hors zone aucun effet ; ralentissement mesuré 0,9 / 0,8 / 0,7 / 0,6 / 0,5 ; dégâts /2 /3 /4 /4 /4 mesurés ; capacités annulées seulement aux niveaux 4 et 5 ; retour progressif à la sortie ; bouton = bombe, pas de double lancement immédiat, aura intacte ; 20 lancements sans baisse de stock ; fragmentation exacte aux 5 niveaux (1 / 1+3 / 1+4+8 / 1+5+15 / 1+5+10) avec plus aucune bombe ensuite ; niveau 5 : les 16 bombes ont rebondi exactement 3 fois avant d'exploser ; dégâts sur adversaire dans l'aura, aucun sur porteur ni allié ; pas de double coup ; maison (tirs à travers le mur) ; 70 s avec bots Annulation niveaux 1 à 5 sur les 3 arènes, 0 erreur, moyenne 0,2 à 0,4 ms par mise à jour ; régressions précédentes.

### Limites
Pas de test multijoueur réel ni sur téléphone. Les bombes et l'aura sont calculées par le même moteur pour tous, mais la synchronisation réseau n'a pas pu être vérifiée. Un "rebond" = 3 rebonds au sol puis explosion au 4e contact. Les invocations déjà posées par un ennemi (golem, tourelles) ne sont pas annulées, seules ses capacités le sont. Valeurs d'équilibrage à valider.

## Rebond : atterrissages multiples, cratères et éclats de terre (27/11)

Fichiers : `rebound.js` (nouveau), `game.js` (1 ligne : l'atterrissage passe par `WB.rebLand`), `index.html`. Les niveaux 1 et 2 sont inchangés.

| Niv | Atterrissages | Cratères par atterrissage | Rebond + étourdissement de l'adversaire |
|---|---|---|---|
| 1-2 | 1 (comme avant) | aucun | non (étourdissement long habituel) |
| 3 | 2 | 1 cercle (0,6 du rayon d'impact) | non, étourdissement habituel |
| 4 | 3 | 2 cercles (0,4 et 0,8, le grand encercle le petit) | oui, étourdi 0,5 s à chaque impact |
| 5 | 3 | 3 cercles (0,3 / 0,6 / 0,9) | oui, 0,5 s, puis météore final qui enflamme |

- Dégâts : chaque atterrissage supplémentaire inflige 25 % de plus que le précédent. Atterrissage = 55 % des dégâts de base du niveau (pour compenser le nombre d'atterrissages), le deuxième onde et le météore se produisent au dernier atterrissage.
- Cratères : anneaux sombres visibles 4 s au sol. De la terre jaillit de chaque anneau (de 38 à 128 morceaux par utilisation selon le niveau), les anneaux se déclenchent du plus proche au plus éloigné. Un morceau de terre blesse l'adversaire qui se trouve sur le cratère : 6 / 7 / 8 dégâts, un seul coup par cratère et par adversaire.
- Rebond adverse (niveau 4+) : l'adversaire touché est soulevé visuellement (34 px) pendant 0,42 s, il reste ciblable et vulnérable, étourdi 0,5 s.
- Les rebonds enchaînés du joueur : 0,4 s chacun, 120 px, orientés vers l'adversaire le plus proche à moins de 300 px, sinon dans la direction du premier bond ; le joueur reste intouchable en l'air comme avant.
- Maisons : ondes, éclats et météore ne blessent pas un ennemi dans une autre pièce ; les éclats ne naissent pas au-delà d'un mur.

### Tests réellement passés
Niveaux 1-2 un seul atterrissage sans cratère ; niveaux 3, 4, 5 : 2, 3, 3 atterrissages avec 1, 2, 3 cratères chacun ; éclats plus nombreux avec le niveau (38, 78, 128) ; dégâts croissants à chaque atterrissage (par exemple niveau 4 : 31,9 / 39,9 / 47,8) ; éclats qui blessent l'adversaire placé sur le cratère, un coup max par cratère, jamais l'allié ; pas de rebond adverse au niveau 3, rebond et étourdissement de 0,5 s aux niveaux 4 et 5 ; maison ; 70 s avec bots Rebond sur les 3 arènes (0,2 à 0,45 ms moyens, aucun éclat ni cratère qui reste, aucun bond bloqué, aucune erreur) ; anciens tests de régression.

### Limites
Pas de test multijoueur ni sur téléphone. Interprétation à valider : « à chaque atterrissage » = plusieurs atterrissages à enchaîner à partir du niveau 3 (2, 3, 3). Si tu veux un seul atterrissage, il suffit de changer un nombre. Les ondes du niveau 1 et 2 gardent le comportement d'avant (elles passent encore à travers les murs de maison, comme avant).

## Invocation : requin, golem, dragon, niveaux 1 à 5 (27/11), en attente de validation

Trois variantes indépendantes, choisies avec le sélecteur de forme existant ; la variante reste fixe pendant la progression. Fichiers : `invoc_art.js` (dessins), `invoc.js` (socle, golems, bras, colosse, titan), `invoc_shark.js`, `invoc_dragon.js`. Un coup par cible et par animation (clé de dédoublonnage par entité). Les attaques respectent les murs de maison.

REQUIN (nage sous terre dans une flaque magique, ne marche jamais, invocation instantanée)
- N1 : petite flaque, mord le plus proche, 30 dégâts + ralentissement 30 % pendant 2,5 s.
- N2 : flaque R120, aileron qui poursuit, morsure 36 + projection + immobilisation 0,5 s.
- N3 : trois flaques, trois requins qui jaillissent à la suite (morsure 28, charge 24, tournoiement 22 qui repousse).
- N4 : immense flaque R190, tourbillon qui attire ~2,4 s, mâchoire qui se ferme : 90 près du centre, 35 ailleurs.
- N5 : R270. La chasse (3,2 s, aileron), la rupture (5 mâchoires simultanées, 42), le grand engloutissement (balayage circulaire + vague, 80, stun 0,8 s).

GOLEM (pierre, PV propres, définitivement détruit à 0 PV, pas de réapparition)
- N1 : trois petits golems (90 PV), coups avec onde de choc.
- N2 : golem protecteur (320 PV), s'interpose devant les projectiles visant le joueur, alterne défense et attaque.
- N3 : deux bras de pierre, structures à 150 PV. Bras 1 : frappe + onde. Bras 2 : surgit sous un ennemi, l'attrape et le lance.
- N4 : colosse (620 PV), marteau de pierre (48), effondrement sous 30 % de PV ou à la mort : 9 rochers (34 chacun).
- N5 : titan (1000 PV), cycle : piliers dévastateurs, écrasement tectonique (fissures + piliers), prison du titan (8 murs à 110 PV qui se referment, 60).

DRAGON (tête seule sortant du sol, durée limitée, replongée progressive, sans PV)
- Couleurs : N1 marron, N2 jaune doré, N3 rouge, N4 blanc, N5 noir, taille croissante. Durées : 9 / 10 / 11 / 12 / 16 s.
- N1 griffes, N2 rangée de crocs avec projection, N3 queue fantôme + morsure simultanée, N4 cage de côtes puis mâchoire (80), N5 les mille griffes, mâchoire abyssale, rugissement de l'extinction, flammes noires (taches au sol 6 s qui s'estompent, 9 dégâts toutes les 0,5 s, ne gênent pas l'invocateur).

TROU NOIR : recharge de chaque charge passée à 5 s dans `evolve.js` (`H.cd`), source unique du compteur, du bouton et de l'IA. Valeurs d'origine réelles : 18 s (niveaux 1 à 4) et 26 s (niveau 5), pas 10 s.

Valeurs (PV, dégâts, durées, seuil 30 % du colosse) : interprétations à valider.

## Voleur (capacité « glut »), refonte des golems, sessions d'invocation (28/11), en attente de validation

VOLEUR (`thief.js`, remplace l'ancien « avale et recrache »), passif, sans bouton
- N1 : portée 340 px, une dague toutes les 0,15 s sur une seule cible. Dégâts croissants par dague qui touche la même cible (3,4 + 1,3 par dague déjà reçue, plafonné à 9 dagues, soit 15 dégâts). La série retombe si la cible n'est plus touchée pendant 2 s. Une dague bloquée par un mur ne blesse pas et ne fait pas monter le compteur.
- N2 : toutes les cibles de la zone reçoivent leurs dagues, compteurs indépendants. Cadence globale ralentie de 18 % par cible en plus, plafonnée à 4 cibles (une dague toutes les 0,23 s au pire). Toucher ou cliquer un ennemi le verrouille (cadence initiale retrouvée, les autres sont libérés) ; recliquer le déverrouille. Jauge de tourbillon (+6 % par impact réel). À 100 % : téléportation au contact de la cible, étourdissement (2,6 s réduit par la résistance de la cible, qui dépend de son niveau et de ses PV max), tourbillon de 3,2 s avec deux dagues, coups toutes les 0,2 s. Le tourbillon va toujours jusqu'au bout, même si la cible s'échappe ou meurt.
- N3 : à une élimination, vole la capacité principale (la plus haute) de l'éliminé, une seule.
- N4 : cible unique automatique (la plus proche, enchaîne), vole toutes les capacités à leur niveau d'origine et récupère la totalité des PV de l'éliminé en soin.
- N5 : le joueur choisit dans un panneau la capacité à voler (12 s, premier choix par défaut), utilisable au niveau 5 quel que soit le niveau du voleur. Les bots prennent la meilleure.
- Les capacités volées s'ajoutent (5 au maximum, la plus ancienne est remplacée au-delà) et fonctionnent avec le vrai comportement de la capacité d'origine. Elles sont perdues à la mort, comme toutes les capacités du jeu.

GOLEMS : nouvelle construction visuelle (`invoc_art.js`) : tête, épaules, torse, deux bras séparés du corps avec coude et poignet, mains à doigts, bassin, deux jambes avec genoux et pieds distincts. Échelles réduites (0,7 / 1,1 / 1,5 / 2,0 au lieu de 0,85 / 1,55 / 2,1 / 2,9). PV, dégâts et comportements inchangés.

SESSIONS D'INVOCATION (`WB.SES` dans `invoc.js`) : chaque élément porte propriétaire, capacité d'origine, numéro de session, état et durée. Dragon : chaque activation ajoute un dragon sans retirer les autres, 5 au maximum par joueur ; à la 6e activation les 5 anciens (de ce joueur seulement) rentrent sous terre, puis le nouveau apparaît. Chaque dragon garde sa durée. Requin (instantané), tourelle (plafond propre) et les autres capacités ne sont pas touchés.
