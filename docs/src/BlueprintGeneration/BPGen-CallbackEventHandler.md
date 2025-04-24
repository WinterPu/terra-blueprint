采用CBExecutor 实现的方式

![](../_images/clipboard_2025-04-18_16-50.bmp)



## DECLARE_DYNAMIC_MULTICAST 这个还是放在类内
在外面可能会有一些奇怪的bug ，导致这个类有的能生成，有的不能生成
影响编译结果的判断
主要是数量太多，会影响后续的判断
放里面
从 572 -> 118
![](../_images/clipboard_2025-04-24_15-21.bmp)