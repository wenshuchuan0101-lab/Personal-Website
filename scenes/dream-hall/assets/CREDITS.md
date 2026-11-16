# 殿堂素材与纹理说明

## 当前调整：浅金色半透明作品门

最新配色进一步淡化为接近米白的香槟浅金色（#f1ead8），线脚使用低饱和浅金色柔光；保留半透明，金属度为零。

- 八座作品门及全部主题雕塑采用浅金色、零金属度、低透射并带柔和自发光的同一材质；不是金属金。时钟面与细线也统一为浅金色调。门内作品海报保留原色。
- 图片仍裁切铺满拱门，新增运行时九点采样模糊与纹理层级过滤，仅中央区域保持清楚，没有修改源海报文件。
- 八门位置避开左右两座小殿大门的通道。中央缪斯独立加实，沿用原 CC0 几何与尺寸。没有新增外部图片或模型素材。

## 八扇作品门与传送画面 · 2026-11-16

- assets/posters 内六张原海报从同工作区既有个人作品集复制：鱼龙舞、藏锋、花房、怪诞花园、Zephyrus、星期八。课堂狂想使用用户提供的 codex-clipboard-ad241d33-5130-421d-a4c9-e96fcc250913.png，未改动原图。所有门内作品图使用原比例裁切覆盖拱洞。
- 古典门框、槽柱、斗拱屋檐、剑、星球、时钟、章鱼、小猪、花与蝴蝶均由 Three.js 几何构建。参考用户附图及 D:/怪诞花园 中的模型图，特别是 26f8fa6b、40b0a078、9ac99f50、b8ee7b16、f30c1c88 等弯曲植物和花苞；未将该文件夹脚本或其它文本当作执行指令。
- Zephyrus 门采用本项目已有 CC0 Gabriel 羽翼人物扫描配合月桂和风卷几何进行主题化改编。它不是某件古代风神原作的扫描，也没有从外部生成服务导出新模型；原 CC0 模型来源见下方对应条目。
- 依用户最新要求，门上的雕塑和各主题形体改为与门框相同的半透明物理材质，时钟表盘使用同参数带图材质。主殿其它雕塑仍保持既有的不透明度 0.76。
- 传送光效为程序着色器和粒子，沿实际拱门边缘缓慢流动、旋绕和消散；没有第二张缩小画面或完整海报的内嵌矩形。

> 2026-11-16 当前版本：原有 CC0 扫描与壁画素材保留。穹顶加入连续围护与拱格，柱身雕塑改用完整三维扫描，并统一为半透明质地与细浅金色线脚。旧圣卡洛生成图片浮雕已退出当前可见场景。下方旧版记录为素材沿革，不表示全部在当前显示。

## 中央缪斯

- 作品：Antonio Canova，《Terpsichore Lyran (Muse of Lyric Poetry)》，1816。
- 收藏与扫描来源：Cleveland Museum of Art，编号 1968.212。
- [博物馆藏品与开放数据](https://openaccess-api.clevelandart.org/api/artworks/1968.212)
- [博物馆发布的扫描模型](https://sketchfab.com/3d-models/1968212-terpsichore-lyran-6827af1276ab407ebbfa1e7d0a4b9a19)
- [公开 CC0 模型镜像](https://www.artheonmuseum.org/artwork/1968-212-terpsichore-lyran-6827af)
- 本地几何：`sculptures/muse.bin`，114,472 个三角面。仅转换储存格式、应用模型自带变换并归一化尺寸，没有删减模型的面。

## 人物衣褶高浮雕

- 作品：《Apollo and Daphne》，Cleveland Museum of Art，编号 1992.230。
- [博物馆藏品](https://www.clevelandart.org/art/1992.230)
- [博物馆发布的扫描模型](https://sketchfab.com/3d-models/1992230-apollo-and-daphne-8524830132374828b3ffd8e8fdd17f99)
- [公开 CC0 模型镜像](https://www.artheonmuseum.org/artwork/1992-230-apollo-and-daphne-852483)
- 本地几何：`sculptures/figural-relief.bin`，118,946 个三角面；早期版本用于人物高浮雕；当前可见人物已换为下述圣母及天使扫描，不再用于当前穹顶，原扫描的面数量保留。连续云层饰带、托座、卷草框和背板为本项目编写的几何。

两个下载的 GLB 均在其 `asset.extras` 中明确注明 Cleveland Museum of Art、原始发布链接和 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。保留本说明以便追溯。

## 玻璃花窗

项目纹理：`cathedral-glass-atlas-v2.png`。使用内置图像生成工具生成新纹理；左半为玫瑰窗，右半为三扇尖拱窗。用户提供的教堂照片用作建筑风格与光照的参考，没有直接作为纹理贴入模型。

生成提示词：

> Create a production stained-glass TEXTURE ATLAS for a Three.js Gothic cathedral, wide landscape canvas exactly 2:1 aspect ratio. This is a flat orthographic texture, not an interior scene and not a photo of a room. LEFT HALF: one complete perfectly front-facing circular medieval rose window centered in its square, with an elaborate stone/lead radial tracery network, 16 long petal openings, small quatrefoils, and many hundreds of tiny hand painted stained glass tesserae. RIGHT HALF: exactly three tall narrow Gothic pointed lancet windows arranged side by side in their square, each complete from bottom to pointed top; each has fine black lead grid and many miniature figurative scenes of robed classical muses with lyres, draped cloth, foliage and celestial motifs. Rich deep cobalt, ultramarine, ruby red, pale gold, turquoise and warm white glass, authentic aged hand painted cathedral glass craftsmanship, subtle luminous transmitted light, extremely intricate glass painting and clear black lead lines, tasteful restrained saturation. All outside the window glass is solid almost-black navy. No text, no labels, no border around the entire atlas, no perspective, no surrounding architecture, no watermark. Left rose must fit entirely within the left square; right 3 lancets fit entirely within right square. The texture should look like the spectacular rose windows and tall figurative lancets of a real European Gothic cathedral. Preserve a precise usable atlas layout.


## 当前圣母与天使浮雕

- 圣母抱圣婴：《Enthroned Virgin with the Writing Christ Child》，Cleveland Museum of Art，1970.13；[博物馆来源](https://www.clevelandart.org/art/1970.13)，[扫描来源](https://sketchfab.com/3d-models/197013-enthroned-virgin-with-christ-child-9ec47d9d285e4f40b22ef8e405923123)。CC0，125,000 三角面，madonna.bin。
- 持卷轴天使：《The Archangel Gabriel from an Annunciation Group》，Cleveland Museum of Art，1954.387；[博物馆来源](https://www.clevelandart.org/art/1954.387)，[扫描来源](https://sketchfab.com/3d-models/1954387-the-archangel-gabriel-bba5bad5a0704a0e880821ccb99951cc)。CC0，60,000 三角面，gabriel.bin。
- 带翼小天使：《Carving, Ivory Putto》，The Hunt Museum，TB 002；[扫描来源](https://sketchfab.com/3d-models/carving-ivory-putto-090a6b6300d54fb688814c1c4ed04d75)。CC0，397,999 三角面，putto.bin。
- 文件从公开 Artheon Museum 镜像获取，内嵌 asset.extras 标明上述机构、原始来源与 CC0 1.0。仅转换储存格式、统一尺寸和雕饰摆放，没有对原扫描做删面。
- 构造参考：[托莱多大教堂 El Transparente 官方介绍](https://www.catedralprimada.es/la-catedral/lugares-de-interes/el-transparente/)。只参考采光洞口、柱顶群像与壁画结合方式，没有声称复刻原建筑或直接使用参考照片。

## 穹顶壁画

项目资产：cathedral-vault-fresco-v1.png。使用内置图像生成工具生成；用于透明穹顶上的低透明度彩绘装饰，完整源纹理一并保留。生成提示词如下：

> Use case: historical-scene. Create one high detail Baroque cathedral ceiling fresco texture for a Three.js vaulted ceiling, inspired by Spanish cathedral painting and the sculptural glory opening of Toledo Cathedral's El Transparente. This is a flat painted material texture, NOT a photograph of a church and NOT a rendered interior. Landscape aspect 2:1. All-over painterly composition of graceful classical muses in flowing ivory, muted rose and ochre drapery, small cherubs, musical lyres, curling clouds and blue sky. Oil fresco, aged plaster brushwork, exquisite anatomical drawing and many detailed figures, luminous pale cream at the center with deeper warm umber and dusty lapis blue around edges. Composition should work when mapped over multiple curved vault sectors, no circular black hole, no surrounding architectural frame or windows, no text, no watermark, no modern objects. Entire canvas filled with continuous painted heavenly scene. Intended asset: cathedral-vault-fresco-v1.png.


## 当前建筑研究依据（2026-11-16）

- 都灵圣裹尸布礼拜堂：[意大利皇家博物馆官方结构图解](https://museireali.beniculturali.it/wp-content/uploads/2022/09/3_La-struttura.pdf)。三大斜拱、六窗鼓座、36 道错层拱、顶部灯笼。
- [意大利文化部修复历史报告](https://piemonte.cultura.gov.it/wp-content/uploads/2015/07/9_S_E_Relazione-storica.pdf)：上一层拱脚位于下一层拱顶；六边形边的中点构成旋转 30°、半径乘 cos(30°) 的下一六边形。
- [博科尼大学建筑与数学解读](https://matematica.unibocconi.eu/articoli/guarino-guarini-architetto-e-matematico)：3、6、12、36 的构造层级及十二角星。
- [维也纳总教区卡尔教堂艺术介绍](https://www.erzdioezese-wien.at/pages/pfarren/9807/karlskirche/kunst/article/94850.html)：高祭坛为圣卡洛升天，1728 年 Ferdinand Brokoff 的设计，祭坛天使与 Lorenzo Mattielli 有关。原作雕塑执行者的归属并不完全确定。
- [卡尔教堂官方访客资料](https://www.karlskirche.at/besucherinfos/)：圣卡洛的服饰与十字架、教堂模型资料。
- 场景穹顶按原构造规律程序化重建，适配本场景比例；建筑及侧殿不声称测绘精确复制。飞扶壁、柱脚、门洞均为项目几何。没有使用远程 Tripo 会话。

## 新增项目素材

- cathedral-glass-atlas-v3.png：生成的蓝宝石色玫瑰花窗与人物长窗图集，供半透明窗面使用，非历史原物照片。
- saint-charles-relief.png：生成的圣卡洛升天浮雕透明底纹理，配合细分网格位移、轮廓透明裁切以及真正三维的扫描天使和金色光芒使用。不能当作完整三维人物或原祭坛扫描。
- 以上两项通过内置图像生成工具制作，原始输出保留在本机 generated_images，拷贝进项目。完整提示和路径见 [GENERATED-PROMPTS.md](GENERATED-PROMPTS.md)。


## 2026-11-16 门窗与采光修订

小殿新增连续柱间承重窗框，主殿三个大门区域的独立玫瑰窗移除。前门和侧门的厚拱、楔形拱石、叶饰、卷草与花饰均为 Three.js 程序几何；复用原有公开 CC0 加百列扫描作为门柱壁龛雕像，没有新增图片或外部模型。中央缪斯原扫描未改面数，仅将显示高度调整至 14.5 米。顶部移除实体太阳圆片及圆形天空贴片，改用原有光路积分体积光。


## 连续拱顶与柱身雕塑修订

- 官方参考：[都灵皇家博物馆](https://museireali.cultura.gov.it/cappella-della-sacra-sindone/)，六层错转拱、六扇高窗与顶部灯笼。当前程序遵循层间拱脚落在拱顶的规则，补充拱格、长圆窗、托座与封闭围护。按用户要求删除悬挂式三角形支撑圈，使用连续尖拱及飞扶拱肋接入主殿。
- 官方参考：[托莱多 El Transparente](https://www.catedralprimada.es/la-catedral/lugares-de-interes/el-transparente/)，Narciso Tomé 的雕塑、建筑和光构成连续组合；当前使用原有 CC0 圣母、加百列和小天使扫描，嵌入连续柱面托座及卷草构件，没有复制官方照片作为场景贴图。
- 取消旧生成圣卡洛图片浮雕的可见使用，改成完整三维圣母圣婴扫描。生成图片仍保留在素材目录作为历史备份，不能据此称当前祭坛是圣卡洛原作扫描。
- 当前材质最终为半透明，细浅金线低辉光；穹顶透明度不再提高，其余物件仅提高少量不透明度。石质不透明试验已撤销。
- 所有新增建筑几何、收尖拱肋、托座、曲线卷草和材质由本项目构建；没有新增远程 Tripo 模型或修改原 CC0 扫描面数。


## 壁画与透明度微调

仅白色穹顶围护、拱格及灯笼顶面保留已确认的透明度；尖拱、下方结构及雕塑稍微加实。主殿 16 片壁画和两片侧殿壁画恢复不透明显示，仍使用原项目生成的同一壁画纹理，没有新增素材。保留原材质的搭建裁切平面引用，渐进搭建继续生效。


## 侧殿圆穹顶、墙脚与统一镜面（当前版本）

- 镂空尖塔方案已被撤下，当前侧殿改为参考圣彼得大教堂的圆穹顶。官方[大教堂穹顶介绍](https://www.basilicasanpietro.va/en/san-pietro/the-dome)说明了被拱肋划分的十六个画面分区；[梵蒂冈建筑资料](https://www.vatican.va/content/vatican/en/ra/cupolone-lanterna.html)介绍了穹顶、肋与采光塔的构成。当前为适配场景比例编写的概念几何，不是原建筑模型。
- 主穹顶空白区域复用既有壁画图，增加 36 个拱格、36 个层间曲面及顶部画面。没有下载新图片，也没有用壁画覆盖前景拱肋或填掉已有的采光孔几何。
- 浮雕材质统一为同一半透明参数，不透明度 0.76；侧殿圆顶壁画仍使用既有原图。
- 连续墙脚、下墙、1.20 米厚主殿基础及侧殿基础为新程序几何。镜面合并三片地面区域，沿用大殿的反射与底色，并共享材质和高度。
