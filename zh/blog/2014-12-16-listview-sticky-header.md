---
layout: post
date: 2014-12-16
title: "ListView 两种固定标头的技巧"
tags: [Android, UI, post]
---
## 第一种情况：

界面上有三个view，上面是一个要隐藏的View A，中间是一个不隐藏的View B，下面有一个ListView C。当C向上滑动的时候，如果A还没有被隐藏，就随着滑动而隐藏，当A完全隐藏之后，B就一直在最上面，C还可以继续向上滑动；当C向下滑动的到底后A逐渐显示出来。

### 突发奇想的省力方法：

> 给 ListView C 添加一个HeadView（包含A、B），然后另外准备一个外部的B在屏幕顶部，一开始不可见。ListView当前滚动高度超过A的高度时，显示外部的B；滚动高度小于A时隐藏内部的B。

<!--more-->

### 效果：

![效果图](http://2bab-images.lastmayday.com/blog/2014-12-16-listview-sticky-header-1.gif?imageslim)


### 代码：


**[MainActivity.java]**

``` java
package net.bingyan.hacklistview;

import android.app.Activity;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AbsListView;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ListView;

public class MainActivity extends Activity {

    private ListView listView;
    private LinearLayout sectionB;
    private int aHeight;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        sectionB = (LinearLayout) findViewById(R.id.main_section_b_outside);
        aHeight = getResources().getDimensionPixelSize(R.dimen.main_a_height);

        initListView();
    }

    private void initListView(){
        listView = (ListView) findViewById(R.id.main_list_view);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_expandable_list_item_1);
        for (int i = 0; i<100; i++){
            adapter.add("item "+String.valueOf(i));
        }
        listView.setAdapter(adapter);
        View headerView = LayoutInflater.from(this).inflate(R.layout.main_header,null);
        listView.addHeaderView(headerView);

        listView.setOnScrollListener(new AbsListView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(AbsListView view, int scrollState) {

            }

            @Override
            public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {
                if (getScrollY() >= aHeight) {
                    if (sectionB.getVisibility() == View.INVISIBLE) {
                        sectionB.setVisibility(View.VISIBLE);
                    }
                } else if (getScrollY() < aHeight){
                    if (sectionB.getVisibility() == View.VISIBLE){
                        sectionB.setVisibility(View.INVISIBLE);
                    }
                }
            }
        });
    }

    //获取滚动距离
    public int getScrollY() {
        View c = listView.getChildAt(0);
        if (c == null) {
            return 0;
        }

        int firstVisiblePosition = listView.getFirstVisiblePosition();
        int top = c.getTop();

        int headerHeight = 0;
        if (firstVisiblePosition >= 1) {
            headerHeight = listView.getHeight();
        }
        return -top + firstVisiblePosition * c.getHeight() + headerHeight;
    }

}
```

**[activity_main.xml]**

``` xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <ListView
        android:id="@+id/main_list_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@color/material_deep_teal_200" />

    <LinearLayout
        android:id="@+id/main_section_b_outside"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:visibility="invisible">

        <include
            layout="@layout/main_section_b"
            android:layout_width="match_parent"
            android:layout_height="wrap_content" />

    </LinearLayout>

</FrameLayout>
```

**[main_header.xml]**

``` xml
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <RelativeLayout
        android:id="@+id/main_section_a"
        android:layout_width="match_parent"
        android:layout_height="@dimen/main_a_height"
        android:background="@color/material_blue_grey_800">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_centerInParent="true"
            android:textSize="@dimen/main_text_size"
            android:text="@string/main_section_a"/>

    </RelativeLayout>

    <include
        android:id="@+id/main_section_b_inside"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        layout="@layout/main_section_b"/>

</LinearLayout>
```

**main_section_b.xml**

``` xml
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <TextView
        android:id="@+id/main_section_b"
        android:layout_width="match_parent"
        android:layout_height="@dimen/main_b_height"
        android:background="@android:color/holo_orange_light"
        android:gravity="center"
        android:textSize="@dimen/main_text_size"
        android:text="@string/main_section_b"/>

</LinearLayout>
```


**备注：**

- 如果 View B 是一个复杂的 View，上面的方案可能需要改进。因为对 内外两个 View B 的一些代码操作可能要写两遍。我现在想的是把 headerView 的 B 去掉，保留同样大小的白色区域，然后外部的 B 根据 ListView 的滚动同步网上滚。

- 有个小 bug 是滚动条在外部的 B 刚显示时会被遮住一部分 = = 不过现在很多设计都不用滚动条了，实在没办法就自己写一个吧。

---
## 第二种情况：
类似于联系人列表的场景，即按首字母对ListView进行分段，并且当前分段标头会停留在ListView最上方。

### 从《50 Android Hacks》中学到的方法：
> 一方面，每个 List Item 都添加一个隐藏的**分段标头**，当第 n 个 Item 与第 n-1 个 Item 的首字母不相同时（或者其他分割条件下的不同），显示这个分段标头。另一方面，在ListView的上层放一个隐藏的标头，标识当前显示的组别。

### 效果：

![](http://2bab-images.lastmayday.com/blog/2014-12-16-listview-sticky-header-2.gif?imageslim)

[源码地址](https://github.com/Macarse/50AH-code/tree/master/hack026)

### 代码：

**[header.xml]**

``` xml
<TextView xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/header"
    style="@android:style/TextAppearance.Small"
    android:layout_width="fill_parent"
    android:layout_height="wrap_content"
    android:background="@color/material_deep_teal_200" />
```

**[activity_main.xml]**

``` xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="fill_parent"
    android:layout_height="fill_parent" >

    <ListView
        android:id="@android:id/list"
        android:layout_width="fill_parent"
        android:layout_height="fill_parent" />

    <include layout="@layout/header" />

</FrameLayout>
```

**[list_item.xml]**

``` xml
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="fill_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical" >

    <include layout="@layout/header" />

    <TextView
        android:id="@+id/label"
        style="@android:style/TextAppearance.Large"
        android:layout_width="fill_parent"
        android:layout_height="wrap_content" />

</LinearLayout>
```

**[MainActivity.java]**

``` java
import android.app.ListActivity;
import android.os.Bundle;
import android.widget.AbsListView;
import android.widget.TextView;

public class MainActivity extends ListActivity {

    private TextView topHeader;
    private int topVisiblePosition = -1;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        topHeader = (TextView) findViewById(R.id.header);
        setListAdapter(new SectionAdapter(this, Countries.COUNTRIES));// Countries.COUNTRIES 是一个静态String数组
        getListView().setOnScrollListener(
                new AbsListView.OnScrollListener() {
                    @Override
                    public void onScrollStateChanged(AbsListView view,
                                                     int scrollState) {
                        // Empty.
                    }

                    @Override
                    public void onScroll(AbsListView view, int firstVisibleItem,
                                         int visibleItemCount, int totalItemCount) {
                        if (firstVisibleItem != topVisiblePosition) {
                            topVisiblePosition = firstVisibleItem;
                            setTopHeader(firstVisibleItem);
                        }
                    }
                });
        setTopHeader(0);
    }

    private void setTopHeader(int pos) {
        final String text = Countries.COUNTRIES[pos].substring(0, 1);
        topHeader.setText(text);
    }
}
```


**[SectionAdapter.java]**

``` java
import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

public class SectionAdapter extends ArrayAdapter<String> {

    private Activity activity;

    public SectionAdapter(Activity activity, String[] objects) {
        super(activity, R.layout.list_item, R.id.label, objects);
        this.activity = activity;
    }

    @Override
    public View getView(int position, View view, ViewGroup parent) {
        if (view == null) {
            view = activity.getLayoutInflater().inflate(R.layout.list_item,
                    parent, false);
        }
        TextView header = (TextView) view.findViewById(R.id.header);
        String label = getItem(position);
        if (position == 0
                || getItem(position - 1).charAt(0) != label.charAt(0)) {
            header.setVisibility(View.VISIBLE);
            header.setText(label.substring(0, 1));
        } else {
            header.setVisibility(View.GONE);
        }
        return super.getView(position, view, parent);
    }
}
```


备注：

- 没有下一个分段标头把上一个顶出去的效果，而只能对置顶的分段标头setText。

- listview 从下面快速滑动到顶部后，会有回弹效果，造成分段标头瞬间变高（或出现两个分段标头）。

*欢迎关注我的[公众号和微博](/about)。*